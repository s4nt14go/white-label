import * as dotenv from 'dotenv';
dotenv.config();
import {
  AccountRepo,
  createUserAndAccount,
  deleteUsers,
} from '../../../../shared/utils/repos';
import { Account } from '../../domain/Account';
import { Request } from './CreateTransactionDTOs';
import { MutationCreateTransactionResponse } from '../../../../shared/infra/appsync/schema.graphql';
import Chance from 'chance';
import { AppSyncClient } from '../../../../shared/infra/appsync/AppSyncClient';
import gql from 'graphql-tag';
import {
  dateFormat,
  deleteItems,
  getByPart,
  getRandom,
  retryDefault,
} from '../../../../shared/utils/test';
import { NotificationTypes } from '../../../notification/domain/NotificationTypes';
import retry from 'async-retry';
import { User } from '../../../users/domain/User';

const appsync = new AppSyncClient();
const chance = new Chance();

// Add all process.env used:
const { StorageTable, NotificationsTable } = process.env;
if (!StorageTable || !NotificationsTable) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

let seed: { user: User, account: Account }, seedUserId : string;
beforeAll(async () => {
  seed = await createUserAndAccount();
  seedUserId = seed.user.id.toString();
});

let auditEvent: Record<string, unknown>;
const notifications: {
  type: NotificationTypes;
  id: string;
}[] = [];
afterAll(async () => {
  await deleteUsers([{ id: seedUserId }]);
  await deleteItems(notifications, NotificationsTable);
  await deleteItems(
    [
      {
        typeAggregateId: auditEvent.typeAggregateId,
        dateTimeOccurred: auditEvent.dateTimeOccurred,
      },
    ],
    StorageTable
  );
});

test('Create transaction', async () => {
  const dto: Request = {
    userId: seedUserId,
    description: `Test: ${chance.sentence()}`,
    delta: getRandom({ min: 0 }),
  };
  const response = await appsync.send({
    query: gql`
      mutation ($userId: ID!, $description: String!, $delta: Float!) {
        createTransaction(
          userId: $userId
          description: $description
          delta: $delta
        ) {
          id
          response_time
        }
      }
    `,
    variables: dto,
  });

  expect(response.status).toBe(200);
  const json = (await response.json()) as MutationCreateTransactionResponse;
  expect(json.data.createTransaction).toMatchObject({
    id: expect.any(String),
    response_time: expect.stringMatching(dateFormat),
  });
  expect(json).not.toMatchObject({
    errors: expect.anything(),
  });

  const account = await AccountRepo.getAccountByUserId(seedUserId);
  if (!account) throw new Error(`Account not found for userId ${seedUserId}`);
  expect(account.transactions.length).toBe(2); // Initial transaction when seeding with createUserAndAccount and the created one
  expect(account.transactions[0].balance.value).toBe(
    seed.account.balance().value + dto.delta
  );
  expect(account.transactions[0].delta.value).toBe(dto.delta);
  expect(account.transactions[0].description.value).toBe(dto.description);
  expect(account.balance().value).toBe(seed.account.balance().value + dto.delta);

  const partValue = `TransactionCreatedEvent#${account.id.toString()}`;
  await retry(async () => {
    const items = await getByPart('typeAggregateId', partValue, StorageTable);
    if (!items) throw Error(`No audit events found for ${partValue}`);
    expect(items).toHaveLength(1);
    auditEvent = items[0];
  }, retryDefault);

  notifications.push({
    type: NotificationTypes.TransactionCreated,
    id: json.data.createTransaction.id,
  });
});
