import * as dotenv from 'dotenv';
dotenv.config();
import {
  AccountRepo,
  createUserAndAccount,
  deleteUsers,
} from '../../../../shared/utils/repos';
import { Account } from '../../domain/Account';
import { Request } from './TransferDTOs';
import Chance from 'chance';
import { Transaction } from '../../domain/Transaction';
import { Amount } from '../../domain/Amount';
import { Description } from '../../domain/Description';
import { AppSyncClient } from '../../../../shared/infra/appsync/AppSyncClient';
import { MutationTransferResponse } from '../../../../shared/infra/appsync/schema.graphql';
import gql from 'graphql-tag';
import {
  dateFormat,
  deleteItems,
  getByPart,
  retryDefault,
} from '../../../../shared/utils/test';
import { NotificationTypes } from '../../../notification/domain/NotificationTypes';
import retry from 'async-retry';
import { User } from '../../../users/domain/User';

const chance = new Chance();
const appsync = new AppSyncClient();

// Add all process.env used:
const { NotificationsTable, StorageTable } = process.env;
if (!NotificationsTable || !StorageTable) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

type Seed = {
  user: User;
  account: Account;
}
let fromSeed: Seed, toSeed: Seed, fund: number, fromSeedUserId: string, toSeedUserId: string;
beforeAll(async () => {
  fromSeed = await createUserAndAccount();
  fromSeedUserId = fromSeed.user.id.toString();
  fund = 100;
  const fundT = Transaction.create({
    delta: Amount.create({ value: fund }).value,
    balance: Amount.create({ value: fund }).value,
    description: Description.create({ value: `Test: ${chance.sentence()}` }).value,
    date: new Date(),
  }).value;
  await AccountRepo.createTransaction(fundT, fromSeed.account.id.toString());
  toSeed = await createUserAndAccount();
  toSeedUserId = toSeed.user.id.toString();
});

let auditEventsFrom: Record<string, unknown>[],
  auditEventsTo: Record<string, unknown>[],
  auditEventsAll: Record<string, unknown>[];
const notifications: {
  type: NotificationTypes;
  id: string;
}[] = [];
afterAll(async () => {
  await deleteUsers([{ id: fromSeedUserId }, { id: toSeedUserId }]);
  await deleteItems(notifications, NotificationsTable);
  auditEventsAll = auditEventsFrom.concat(auditEventsTo);
  auditEventsAll = auditEventsAll.map((event) => {
    const { typeAggregateId, dateTimeOccurred } = event;
    return {
      typeAggregateId,
      dateTimeOccurred,
    };
  });
  await deleteItems(auditEventsAll, StorageTable);
});

test('Transfer', async () => {
  const dto: Request = {
    fromUserId: fromSeedUserId,
    fromDescription: `Test: ${chance.sentence()}`,
    toUserId: toSeedUserId,
    toDescription: `Test: ${chance.sentence()}`,
    quantity: 50,
  };
  const response = await appsync.send({
    query: gql`
      mutation MyMutation(
        $fromDescription: String!
        $fromUserId: ID!
        $quantity: Float!
        $toUserId: ID!
        $toDescription: String
      ) {
        transfer(
          fromDescription: $fromDescription
          fromUserId: $fromUserId
          quantity: $quantity
          toUserId: $toUserId
          toDescription: $toDescription
        ) {
          fromTransaction
          toTransaction
          response_time
        }
      }
    `,
    variables: dto,
  });

  expect(response.status).toBe(200);
  const json = (await response.json()) as MutationTransferResponse;
  expect(json.data.transfer).toMatchObject({
    fromTransaction: expect.any(String),
    toTransaction: expect.any(String),
    response_time: expect.stringMatching(dateFormat),
  });
  expect(json).not.toMatchObject({
    errors: expect.anything(),
  });

  let partValue = `TransactionCreatedEvent#${fromSeed.account.id.toString()}`;
  await retry(async () => {
    let items = await getByPart('typeAggregateId', partValue, StorageTable);
    if (!items) throw Error(`No audit events found for ${partValue}`);
    expect(items).toHaveLength(1);
    auditEventsFrom = items;
    notifications.push({
      type: NotificationTypes.TransactionCreated,
      id: json.data.transfer.fromTransaction,
    });
    partValue = `TransactionCreatedEvent#${toSeed.account.id.toString()}`;
    items = await getByPart('typeAggregateId', partValue, StorageTable);
    if (!items) throw Error(`No audit events found for ${partValue}`);
    expect(items).toHaveLength(1);
    auditEventsTo = items;
    notifications.push({
      type: NotificationTypes.TransactionCreated,
      id: json.data.transfer.toTransaction,
    });
  }, retryDefault);
});
