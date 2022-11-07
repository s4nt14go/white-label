import * as dotenv from 'dotenv';
dotenv.config();
import retry from 'async-retry';
import {
  addDecimals, deleteItems,
  getByPart,
  getAppSyncEvent as getEvent,
  getRandom,
  invokeLambda,
  retryDefault,
} from '../../../../shared/utils/test';
import {
  deleteUsers,
  AccountRepo,
  createUserAndAccount,
} from '../../../../shared/utils/repos';
import { Request } from './CreateTransactionDTO';
import Chance from 'chance';
import { Account } from '../../domain/Account';
import { NotificationTypes } from '../../../notification/domain/NotificationTypes';
import { Amount } from '../../domain/Amount';

const chance = new Chance();

// Add all process.env used:
const { createTransaction, NotificationsTable, StorageTable } = process.env;
if (!createTransaction || !NotificationsTable || !StorageTable) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

let seed: { userId: string; account: Account };
beforeAll(async () => {
  seed = await createUserAndAccount();
});

const notifications: {
  type: NotificationTypes,
  id: string,
}[] = [];
let auditEvents: Record<string, unknown>[];
afterAll(async () => {
  await deleteUsers([{ id: seed.userId }]);
  await deleteItems(auditEvents.map(event => {
    const { typeAggregateId, dateTimeOccurred } = event;
    return {
      typeAggregateId,
      dateTimeOccurred,
    };
  }), StorageTable);
  await deleteItems(notifications, NotificationsTable);
});

test('Create transactions', async () => {
  // Create first transaction
  const dto1: Request = {
    userId: seed.userId,
    description: `Test: ${chance.sentence()}`,
    delta: getRandom({ min: 0 }),
  };
  console.log('dto1', dto1);
  let invoked = await invokeLambda(getEvent(dto1), createTransaction);

  expect(invoked).toMatchObject({
    time: expect.any(String),
    result: {
      id: expect.any(String),
    },
  });
  expect(invoked).not.toMatchObject({
    error: expect.anything(),
  });
  notifications.push({
    type: NotificationTypes.TransactionCreated,
      id: invoked.result.id,
  });

  // Create second transaction
  const dto2: Request = {
    userId: seed.userId,
    description: `Test: ${chance.sentence()}`,
    delta: getRandom({ min: -dto1.delta, max: Amount.MAX_ABS - dto1.delta }),
  };
  console.log('dto2', dto2);
  invoked = await invokeLambda(getEvent(dto2), createTransaction);

  expect(invoked).toMatchObject({
    time: expect.any(String),
    result: {
      id: expect.any(String),
    },
  });
  expect(invoked).not.toMatchObject({
    error: expect.anything(),
  });
  notifications.push({
    type: NotificationTypes.TransactionCreated,
      id: invoked.result.id,
  });

  const account = await AccountRepo.getAccountByUserId(seed.userId);
  if (!account) throw new Error(`Account not found for userId ${seed.userId}`);
  expect(account.transactions.length).toBe(3); // Initial transaction when seeding with createUserAndAccount and the 2 created
  expect(account.transactions[1].balance.value).toBe(
    seed.account.balance().value + dto1.delta
  );
  expect(account.transactions[1].delta.value).toBe(dto1.delta);
  expect(account.transactions[1].description.value).toBe(dto1.description);
  const expected = addDecimals(
    seed.account.balance().value,
    dto1.delta,
    dto2.delta
  );
  if (account.transactions[0].balance.value !== expected) {
    console.log(
      'account.transactions[0].balance.value',
      account.transactions[0].balance.value
    );
    console.log('seed.account.balance().value', seed.account.balance().value);
    console.log('dto1.delta', dto1.delta);
    console.log('dto2.delta', dto2.delta);
    console.log('account', account);
    console.log('seed', seed);
    console.log('dto1', dto1);
    console.log('dto2', dto2);
  }
  expect(account.transactions[0].balance.value).toBe(expected);
  expect(account.transactions[0].delta.value).toBe(dto2.delta);
  expect(account.transactions[0].description.value).toBe(dto2.description);
  expect(account.balance().value).toBe(expected);
  // Side effects in audit module
  const partValue = `TransactionCreatedEvent#${account.id.toString()}`;
  await retry(
    async () => {
      const got = await getByPart('typeAggregateId', partValue, StorageTable);
      if (!got) throw Error(`No audit events found for ${partValue}`);
      auditEvents = got;
      expect(auditEvents).toHaveLength(2);
      expect(auditEvents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            typeAggregateId: partValue,
            id: account.transactions[1].id.toString(),
          }),
          expect.objectContaining({
            typeAggregateId: partValue,
            id: account.transactions[0].id.toString(),
          }),
        ])
      );
    }, retryDefault);
});
