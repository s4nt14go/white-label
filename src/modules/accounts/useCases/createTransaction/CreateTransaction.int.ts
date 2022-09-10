import * as dotenv from 'dotenv';
dotenv.config();
import 'aws-testing-library/lib/jest';
import { TextEncoder } from 'util';
import { Lambda } from '@aws-sdk/client-lambda';
import stringify from 'json-stringify-safe';
import { parsePayload } from '../../../../shared/utils/test';
import {
  deleteUsers,
  AccountRepo,
  createUserAndAccount,
} from '../../../../shared/utils/repos';
import { CreateTransactionDTO } from './CreateTransactionDTO';
import Chance from 'chance';
import { Account } from '../../domain/Account';
import { Amount } from '../../domain/Amount';

const chance = new Chance();

// Add all process.env used:
const { createTransaction } = process.env;
if (!createTransaction) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

let seed: { userId: string; account: Account }, expected;
beforeAll(async () => {
  seed = await createUserAndAccount();
});

afterAll(async () => {
  await AccountRepo.deleteByUserId(seed.userId);
  await deleteUsers([{ id: seed.userId }]);
});

test('Create transactions', async () => {
  // Create first transaction
  const dto1: CreateTransactionDTO = {
    userId: seed.userId,
    description: `Test: ${chance.sentence()}`,
    delta: Math.round(Math.random() * 100) / 100,
  };
  let invoked = await invokeCreateTransaction(dto1);

  expect(invoked.statusCode).toBe(201);

  // Create second transaction
  const dto2: CreateTransactionDTO = {
    userId: seed.userId,
    description: `Test: ${chance.sentence()}`,
    delta: Math.round(Math.random() * 100) / 100,
  };
  invoked = await invokeCreateTransaction(dto2);

  expect(invoked.statusCode).toBe(201);

  const account = await AccountRepo.getAccountByUserId(seed.userId);
  if (!account) throw new Error(`Account not found for userId ${seed.userId}`);
  expect(account.transactions.length).toBe(3); // Initial transaction when seeding with createUserAndAccount and the 2 created
  expect(account.transactions[1].balance.value).toBe(
    seed.account.balance.value + dto1.delta
  );
  expect(account.transactions[1].delta.value).toBe(dto1.delta);
  expect(account.transactions[1].description.value).toBe(dto1.description);

  expected = seed.account.balance.value + dto1.delta + dto2.delta;
  expected = Amount.create({ value: expected }).value.value; // round to correct decimals quantity
  expect(account.transactions[0].balance.value).toBe(expected);

  expect(account.transactions[0].delta.value).toBe(dto2.delta);
  expect(account.transactions[0].description.value).toBe(dto2.description);
  expect(account.balance.value).toBe(
    seed.account.balance.value + dto1.delta + dto2.delta
  );
});

const lambdaClient = new Lambda({});
const invokeCreateTransaction = async (dto: CreateTransactionDTO) => {
  const req = {
    FunctionName: createTransaction,
    Payload: new TextEncoder().encode(stringify(dto)),
  };

  const result = await lambdaClient.invoke(req);

  return parsePayload(result.Payload);
};
