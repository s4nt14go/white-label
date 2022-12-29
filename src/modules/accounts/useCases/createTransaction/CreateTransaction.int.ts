import * as dotenv from 'dotenv';
dotenv.config();
import retry from 'async-retry';
import {
  addDecimals,
  deleteItems,
  getByPart,
  getAppSyncEvent as getEvent,
  getRandom,
  invokeLambda,
  retryDefault,
  getRetryItem,
  dateFormat,
  fakeTransactionWithError,
  deleteAuditEventsByPart,
} from '../../../../shared/utils/test';
import {
  deleteUsers,
  AccountRepo,
  createUserAndAccount,
} from '../../../../shared/utils/repos';
import { Request } from './CreateTransactionDTOs';
import Chance from 'chance';
import { Account } from '../../domain/Account';
import { NotificationTypes } from '../../../notification/domain/NotificationTypes';
import { Amount } from '../../domain/Amount';
import { AccountRepoFake } from '../../repos/AccountRepoFake';
import { Transaction } from '../../../../shared/decorators/Transaction';
import { CreateTransaction } from './CreateTransaction';
import { LambdaInvokerFake } from '../../../../shared/infra/invocation/LambdaInvokerFake';
import { DBretry } from '../../../../shared/decorators/DBretry';
import { DBretryTable } from '../../../../shared/decorators/DBretryTable';
import { Envelope } from '../../../../shared/core/Envelope';
import { Created } from '../../../../shared/core/Created';
import { Context } from 'aws-lambda';
import { User } from '../../../users/domain/User';

const chance = new Chance();

// Add all process.env used:
const {
  createTransaction,
  NotificationsTable,
  StorageTable,
  DBretryTable: DBretryTableName,
} = process.env;
if (
  !createTransaction ||
  !NotificationsTable ||
  !StorageTable ||
  !DBretryTableName
) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

let seed: { user: User; account: Account };
let seedUserId: string;
beforeAll(async () => {
  seed = await createUserAndAccount();
  seedUserId = seed.user.id.toString();
});

const notifications: {
  type: NotificationTypes;
  id: string;
}[] = [];
const auditEventsKeys: Record<string, unknown>[] = [];
let auditEventsPart: string;
afterAll(async () => {
  await deleteUsers([{ id: seedUserId }]);
  await deleteItems(notifications, NotificationsTable);
  await deleteAuditEventsByPart([auditEventsPart]);
});

test('Create transactions', async () => {
  // Create first transaction
  const dto1: Request = {
    userId: seedUserId,
    description: `Test: ${chance.sentence()}`,
    delta: getRandom({ min: 0 }),
  };
  console.log('dto1', dto1);
  let invoked = await invokeLambda(getEvent(dto1), createTransaction);

  expect(invoked).toMatchObject({
    time: expect.stringMatching(dateFormat),
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
    userId: seedUserId,
    description: `Test: ${chance.sentence()}`,
    delta: getRandom({ min: -dto1.delta, max: Amount.MAX_ABS - dto1.delta }),
  };
  console.log('dto2', dto2);
  invoked = await invokeLambda(getEvent(dto2), createTransaction);

  expect(invoked).toMatchObject({
    time: expect.stringMatching(dateFormat),
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

  const account = await AccountRepo.getAccountByUserId(seedUserId);
  if (!account) throw new Error(`Account not found for userId ${seedUserId}`);
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
  auditEventsPart = `TransactionCreatedEvent#${account.id.toString()}`;
  await retry(async () => {
    const got = await getByPart('typeAggregateId', auditEventsPart, StorageTable);
    if (!got) throw Error(`No audit events found for ${auditEventsPart}`);
    expect(got).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          typeAggregateId: auditEventsPart,
          id: account.transactions[1].id.toString(),
        }),
        expect.objectContaining({
          typeAggregateId: auditEventsPart,
          id: account.transactions[0].id.toString(),
        }),
      ])
    );
    got.map((auditEvent) => {
      const { typeAggregateId, dateTimeOccurred } = auditEvent;
      auditEventsKeys.push({
        typeAggregateId,
        dateTimeOccurred,
      });
    });
  }, retryDefault);
});

test('DB retry for an AppSyncController', async () => {
  const accountRepo = new AccountRepoFake();
  accountRepo.setGoodUserId(seedUserId);
  const controller = new CreateTransaction(accountRepo, new LambdaInvokerFake());
  const data: Request = {
    userId: seedUserId,
    description: `Test: ${chance.sentence()}`,
    delta: 30,
  };

  // In the first attempt to create a transaction will fail because we're using fakeTransactionWithError
  const decorated1 = new Transaction(controller, fakeTransactionWithError, [
    accountRepo,
  ]);
  // ...in the second attempt the retry will succeed because DBretry loads index.ts where the transaction is properly created
  const dBretryTable = new DBretryTable();
  const decorated2 = new DBretry(
    decorated1,
    dBretryTable,
    () => null,
    `${__dirname}/index.ts`
  );
  const test_context = {
    logGroupName: 'test_logGroupName',
    logStreamName: 'test_logStreamName',
    awsRequestId: 'test_awsRequestId',
  } as Context;
  const result = await decorated2.execute(getEvent(data), test_context);

  expect(result).toMatchObject({
    time: expect.stringMatching(dateFormat),
    result: {
      id: expect.any(String),
    },
  });
  notifications.push({
    type: NotificationTypes.TransactionCreated,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    id: (result as Envelope<Created>).result!.id,
  });

  const account = await AccountRepo.getAccountByUserId(seedUserId);
  if (!account) throw new Error(`Account not found for userId ${seedUserId}`);
  auditEventsPart = `TransactionCreatedEvent#${account.id.toString()}`;
  const got = await getByPart('typeAggregateId', auditEventsPart, StorageTable);
  if (!got) throw Error(`No audit events found for ${auditEventsPart}`);
  got.map((auditEvent) => {
    const { typeAggregateId, dateTimeOccurred } = auditEvent;
    auditEventsKeys.push({
      typeAggregateId,
      dateTimeOccurred,
    });
  });

  const retryTokenBeginning = dBretryTable.genToken(data).slice(0, -2);
  const retryItem = await getRetryItem(retryTokenBeginning);
  expect(retryItem).toMatchObject({
    fail1: expect.stringMatching(dateFormat),
    retryToken: expect.stringMatching(new RegExp(`^${retryTokenBeginning}`)),
    fail1logGroup: test_context.logGroupName,
    fail1logStream: test_context.logStreamName,
    fail1request: test_context.awsRequestId,
  });
  expect(retryItem.failNumber).toBeGreaterThanOrEqual(1); // Sometimes the DB fails by its own, apart from the faked error of fakeTransactionWithError, so the total failNumber count can be higher than 1
  expect(JSON.parse(retryItem.dto)).toMatchObject({
    ...data,
    firstFail: expect.stringMatching(dateFormat),
  });

  // As retryItemKey is undefined in test 'Create transactions',
  // this deleteItems can't be included in afterAll as the code will escape
  // (whenever only 'Create transactions' is run)
  await deleteItems(
    [
      {
        retryToken: retryItem.retryToken,
      },
    ],
    DBretryTableName
  );
});
