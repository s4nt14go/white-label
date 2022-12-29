import * as dotenv from 'dotenv';
dotenv.config();
import {
  deleteItems,
  getRetryItem,
  dateFormat,
  fakeTransactionWithError,
} from '../../../../shared/utils/test';
import {
  deleteUsers,
  createUser,
} from '../../../../shared/utils/repos';
import { Request } from './CreateAccountDTOs';
import { AccountRepoFake } from '../../repos/AccountRepoFake';
import { Transaction } from '../../../../shared/decorators/Transaction';
import { CreateAccount } from './CreateAccount';
import { DBretry } from '../../../../shared/decorators/DBretry';
import { DBretryTable } from '../../../../shared/decorators/DBretryTable';
import { Context } from 'aws-lambda';
import { UserCreatedEvent } from '../../../users/domain/events/UserCreatedEvent';
import { User } from '../../../users/domain/User';

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

let seedUser: User;
beforeAll(async () => {
  seedUser = await createUser();
});

let retryItemKey: Record<string, unknown>;
afterAll(async () => {
  await deleteItems([retryItemKey], DBretryTableName);
  await deleteUsers([{ id: seedUser.id.toString() }]);
});

test('DB retry for a SubscriberController', async () => {
  const accountRepo = new AccountRepoFake();
  accountRepo.setGoodUserId(seedUser.id.toString());
  const controller = new CreateAccount(accountRepo);
  const data: Request = new UserCreatedEvent(seedUser).toDTO();

  // In the first attempt to create a transaction will fail because we're using fakeTransactionWithError
  const decorated1 = new Transaction(controller, fakeTransactionWithError, [
  // const decorated1 = new Transaction(controller, models.getTransaction, [
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
  const result = await decorated2.execute(data, test_context);

  expect(result).toMatchObject({
    time: expect.stringMatching(dateFormat),
  });

  const retryTokenBeginning = dBretryTable.genToken(data).slice(0, -2);
  const retryItem = await getRetryItem(retryTokenBeginning);
  expect(retryItem).toMatchObject({
    failNumber: 1,
    fail1: expect.stringMatching(dateFormat),
    retryToken: expect.stringMatching(new RegExp(`^${retryTokenBeginning}`)),
    fail1logGroup: test_context.logGroupName,
    fail1logStream: test_context.logStreamName,
    fail1request: test_context.awsRequestId,
  });
  expect(JSON.parse(retryItem.dto)).toMatchObject({
    ...data,
    firstFail: expect.stringMatching(dateFormat),
  });
  retryItemKey = {
    retryToken: retryItem.retryToken,
  };
});
