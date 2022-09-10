import * as dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';
import {
  AccountRepo,
  createUserAndAccount,
  deleteUsers,
} from '../../../../shared/utils/repos';
import { Account } from '../../domain/Account';
import { CreateTransactionDTO } from './CreateTransactionDTO';
import Chance from 'chance';

const chance = new Chance();

// Add all process.env used:
const { apiUrl } = process.env;
if (!apiUrl) {
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

test('Create transaction', async () => {
  const dto: CreateTransactionDTO = {
    userId: seed.userId,
    description: `Test: ${chance.sentence()}`,
    delta: Math.round(Math.random() * 100) / 100,
  };
  const response = await fetch(process.env.apiUrl + '/createTransaction', {
    method: 'post',
    body: JSON.stringify(dto),
    headers: { 'Content-Type': 'application/json' },
  });

  expect(response.status).toBe(201);

  const account = await AccountRepo.getAccountByUserId(seed.userId);
  if (!account) throw new Error(`Account not found for userId ${seed.userId}`);
  expect(account.transactions.length).toBe(2);  // Initial transaction when seeding with createUserAndAccount and the created one
  expect(account.transactions[0].balance.value).toBe(seed.account.balance.value + dto.delta);
  expect(account.transactions[0].delta.value).toBe(dto.delta);
  expect(account.transactions[0].description.value).toBe(dto.description);
  expect(account.balance.value).toBe(seed.account.balance.value + dto.delta);
});
