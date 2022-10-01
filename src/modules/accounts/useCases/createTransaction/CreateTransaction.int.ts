import * as dotenv from 'dotenv';
dotenv.config();
import {
  addDecimals,
  getAppSyncEvent as getEvent,
  invokeLambda,
} from '../../../../shared/utils/test';
import {
  deleteUsers,
  AccountRepo,
  createUserAndAccount,
} from '../../../../shared/utils/repos';
import { Request } from './CreateTransactionDTO';
import Chance from 'chance';
import { Account } from '../../domain/Account';

const chance = new Chance();

// Add all process.env used:
const { createTransaction } = process.env;
if (!createTransaction) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

let seed: { userId: string; account: Account };
beforeAll(async () => {
  seed = await createUserAndAccount();
});

afterAll(async () => {
  await AccountRepo.deleteByUserId(seed.userId);
  await deleteUsers([{ id: seed.userId }]);
});

test('Create transactions', async () => {
  // Create first transaction
  const dto1: Request = {
    userId: seed.userId,
    description: `Test: ${chance.sentence()}`,
    delta: chance.floating({ min: 0, fixed: 2 }),
  };
  let invoked = await invokeLambda(getEvent(dto1), createTransaction);

  expect(invoked).toMatchObject({
    time: expect.any(String),
  });
  expect(invoked).not.toMatchObject({
    error: expect.anything(),
  });

  // Create second transaction
  const dto2: Request = {
    userId: seed.userId,
    description: `Test: ${chance.sentence()}`,
    delta: chance.floating({ min: -dto1.delta, fixed: 2 }),
  };
  invoked = await invokeLambda(getEvent(dto2), createTransaction);

  expect(invoked).toMatchObject({
    time: expect.any(String),
  });
  expect(invoked).not.toMatchObject({
    error: expect.anything(),
  });

  const account = await AccountRepo.getAccountByUserId(seed.userId);
  if (!account) throw new Error(`Account not found for userId ${seed.userId}`);
  expect(account.transactions.length).toBe(3); // Initial transaction when seeding with createUserAndAccount and the 2 created
  expect(account.transactions[1].balance.value).toBe(
    seed.account.balance.value + dto1.delta
  );
  expect(account.transactions[1].delta.value).toBe(dto1.delta);
  expect(account.transactions[1].description.value).toBe(dto1.description);
  const expected = addDecimals(seed.account.balance.value, dto1.delta, dto2.delta);
  expect(account.transactions[0].balance.value).toBe(expected);
  expect(account.transactions[0].delta.value).toBe(dto2.delta);
  expect(account.transactions[0].description.value).toBe(dto2.description);
  expect(account.balance.value).toBe(expected);
});
