import * as dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';
import {
  AccountRepo,
  createUserAndAccount,
  deleteUsers,
} from '../../../../shared/utils/repos';
import { Account } from '../../domain/Account';
import { TransferDTO } from './TransferDTO';
import Chance from 'chance';
import { Transaction } from '../../domain/Transaction';
import { Amount } from '../../domain/Amount';
import { Description } from '../../domain/Description';

const chance = new Chance();

// Add all process.env used:
const { apiUrl } = process.env;
if (!apiUrl) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

interface Seed {
  userId: string;
  account: Account;
}
let fromSeed: Seed, toSeed: Seed, fund: number;
beforeAll(async () => {
  fromSeed = await createUserAndAccount();
  fund = 100;
  const fundT = Transaction.create({
    delta: Amount.create({ value: fund }).value,
    balance: Amount.create({ value: fund }).value,
    description: Description.create({ value: `Test: ${chance.sentence()}` }).value,
    date: new Date(),
  }).value;
  await AccountRepo.createTransaction(fundT, fromSeed.userId);
  toSeed = await createUserAndAccount();
});

afterAll(async () => {
  await AccountRepo.deleteByUserId(fromSeed.userId);
  await AccountRepo.deleteByUserId(toSeed.userId);
  await deleteUsers([{ id: fromSeed.userId }, { id: toSeed.userId }]);
});

test('Transfer', async () => {
  const dto: TransferDTO = {
    fromUserId: fromSeed.userId,
    fromDescription: `Test: ${chance.sentence()}`,
    toUserId: toSeed.userId,
    toDescription: `Test: ${chance.sentence()}`,
    quantity: 50,
  };
  const response = await fetch(process.env.apiUrl + '/transfer', {
    method: 'post',
    body: JSON.stringify(dto),
    headers: { 'Content-Type': 'application/json' },
  });

  expect(response.status).toBe(201);

  const fromAccount = await AccountRepo.getAccountByUserId(fromSeed.userId);
  if (!fromAccount) throw new Error(`Account not found for userId ${fromSeed.userId}`);
  expect(fromAccount.transactions.length).toBe(3);  // Initial transaction when seeding with createUserAndAccount, funding and transfer
  expect(fromAccount.transactions[0].balance.value).toBe(fromSeed.account.balance.value + fund - dto.quantity);
  expect(fromAccount.transactions[0].delta.value).toBe(-dto.quantity);
  expect(fromAccount.transactions[0].description.value).toBe(dto.fromDescription);

  const toAccount = await AccountRepo.getAccountByUserId(toSeed.userId);
  if (!toAccount) throw new Error(`Account not found for userId ${toSeed.userId}`);
  expect(toAccount.transactions.length).toBe(2);  // Initial transaction when seeding with createUserAndAccount and transfer
  expect(toAccount.transactions[0].balance.value).toBe(toSeed.account.balance.value + dto.quantity);
  expect(toAccount.transactions[0].delta.value).toBe(dto.quantity);
  expect(toAccount.transactions[0].description.value).toBe(dto.toDescription);
});
