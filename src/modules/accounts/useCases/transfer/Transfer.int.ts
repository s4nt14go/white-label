import * as dotenv from 'dotenv';
dotenv.config();
import {
  dateFormat,
  deleteItems,
  getAppSyncEvent as getEvent,
  getByPart,
  invokeLambda,
  retryDefault,
} from '../../../../shared/utils/test';
import {
  deleteUsers,
  AccountRepo,
  createUserAndAccount,
} from '../../../../shared/utils/repos';
import { Request } from './TransferDTOs';
import Chance from 'chance';
import { Account } from '../../domain/Account';
import { Transaction } from '../../domain/Transaction';
import { Amount } from '../../domain/Amount';
import { Description } from '../../domain/Description';
import { NotificationTypes } from '../../../notification/domain/NotificationTypes';
import retry from 'async-retry';
import { User } from '../../../users/domain/User';

const chance = new Chance();

// Add all process.env used:
const { transfer, NotificationsTable, StorageTable } = process.env;
if (!transfer || !NotificationsTable || !StorageTable) {
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

const notifications: {
  type: NotificationTypes;
  id: string;
}[] = [];
let auditEventsFrom: Record<string, unknown>[],
  auditEventsTo: Record<string, unknown>[],
  auditEventsAll: Record<string, unknown>[];
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

test('transfer', async () => {
  const dto: Request = {
    fromUserId: fromSeedUserId,
    toUserId: toSeedUserId,
    quantity: 30,
    fromDescription: `Test: ${chance.sentence()}`,
    toDescription: `Test: ${chance.sentence()}`,
  };
  const invoked = await invokeLambda(getEvent(dto), transfer);

  expect(invoked).not.toMatchObject({
    error: expect.anything(),
  });

  const fromAccount = await AccountRepo.getAccountByUserId(fromSeedUserId);
  if (!fromAccount)
    throw new Error(`fromAccount not found for userId ${fromSeedUserId}`);
  expect(fromAccount.transactions.length).toBe(3); // Initial transaction when seeding with createUserAndAccount, funding transaction and transfer
  expect(fromAccount.transactions[0].balance.value).toBe(
    fromSeed.account.balance().value + fund - dto.quantity
  );
  expect(fromAccount.transactions[0].delta.value).toBe(-dto.quantity);
  expect(fromAccount.transactions[0].description.value).toBe(dto.fromDescription);
  expect(fromAccount.balance().value).toBe(
    fromSeed.account.balance().value + fund - dto.quantity
  );

  const toAccount = await AccountRepo.getAccountByUserId(toSeedUserId);
  if (!toAccount)
    throw new Error(`toAccount not found for userId ${toSeedUserId}`);
  expect(toAccount.transactions.length).toBe(2); // Initial transaction when seeding with createUserAndAccount and transfer
  expect(toAccount.transactions[0].balance.value).toBe(
    toSeed.account.balance().value + dto.quantity
  );
  expect(toAccount.transactions[0].delta.value).toBe(dto.quantity);
  expect(toAccount.transactions[0].description.value).toBe(dto.toDescription);
  expect(toAccount.balance().value).toBe(
    toSeed.account.balance().value + dto.quantity
  );

  expect(invoked).toMatchObject({
    time: expect.stringMatching(dateFormat),
    result: {
      fromTransaction: fromAccount.transactions[0].id.toString(),
      toTransaction: toAccount.transactions[0].id.toString(),
    },
  });

  // Side effects in audit module
  let partValue = `TransactionCreatedEvent#${fromAccount.id.toString()}`;
  await retry(async () => {
    let got = await getByPart('typeAggregateId', partValue, StorageTable);
    if (!got) throw Error(`No audit events found for ${partValue}`);
    auditEventsFrom = got;
    expect(auditEventsFrom).toHaveLength(1);
    expect(auditEventsFrom).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          typeAggregateId: partValue,
          id: fromAccount.transactions[0].id.toString(),
        }),
      ])
    );

    partValue = `TransactionCreatedEvent#${toAccount.id.toString()}`;
    got = await getByPart('typeAggregateId', partValue, StorageTable);
    if (!got) throw Error(`No audit events found for ${partValue}`);
    auditEventsTo = got;
    expect(auditEventsTo).toHaveLength(1);
    expect(auditEventsTo).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          typeAggregateId: partValue,
          id: toAccount.transactions[0].id.toString(),
        }),
      ])
    );
  }, retryDefault);

  notifications.push({
    type: NotificationTypes.TransactionCreated,
    id: fromAccount.transactions[0].id.toString(),
  });
  notifications.push({
    type: NotificationTypes.TransactionCreated,
    id: toAccount.transactions[0].id.toString(),
  });
});
