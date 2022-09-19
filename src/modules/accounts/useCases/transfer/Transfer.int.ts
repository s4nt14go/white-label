import * as dotenv from 'dotenv';
dotenv.config();
import { getAppSyncEvent as getEvent, invokeLambda } from '../../../../shared/utils/test';
import {
  deleteUsers,
  AccountRepo,
  createUserAndAccount,
} from '../../../../shared/utils/repos';
import { Request } from './TransferDTO';
import Chance from 'chance';
import { Account } from '../../domain/Account';
import { Transaction } from '../../domain/Transaction';
import { Amount } from '../../domain/Amount';
import { Description } from '../../domain/Description';

const chance = new Chance();

// Add all process.env used:
const { transfer } = process.env;
if (!transfer) {
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

test('transfer', async () => {
  // Create first transaction
  const dto: Request = {
    fromUserId: fromSeed.userId,
    toUserId: toSeed.userId,
    quantity: 30,
    fromDescription: `Test: ${chance.sentence()}`,
    toDescription: `Test: ${chance.sentence()}`,
  };
  const invoked = await invokeLambda(getEvent(dto), transfer);

  expect(invoked.result.status).toBe(201);
  expect(invoked).not.toMatchObject({
    error: expect.anything(),
  });

  const fromAccount = await AccountRepo.getAccountByUserId(fromSeed.userId);
  if (!fromAccount)
    throw new Error(`fromAccount not found for userId ${fromSeed.userId}`);
  expect(fromAccount.transactions.length).toBe(3); // Initial transaction when seeding with createUserAndAccount, funding transaction and transfer
  expect(fromAccount.transactions[0].balance.value).toBe(
    fromSeed.account.balance.value + fund - dto.quantity
  );
  expect(fromAccount.transactions[0].delta.value).toBe(-dto.quantity);
  expect(fromAccount.transactions[0].description.value).toBe(dto.fromDescription);
  expect(fromAccount.balance.value).toBe(
    fromSeed.account.balance.value + fund - dto.quantity
  );

  const toAccount = await AccountRepo.getAccountByUserId(toSeed.userId);
  if (!toAccount)
    throw new Error(`toAccount not found for userId ${toSeed.userId}`);
  expect(toAccount.transactions.length).toBe(2); // Initial transaction when seeding with createUserAndAccount and transfer
  expect(toAccount.transactions[0].balance.value).toBe(
    toSeed.account.balance.value + dto.quantity
  );
  expect(toAccount.transactions[0].delta.value).toBe(dto.quantity);
  expect(toAccount.transactions[0].description.value).toBe(dto.toDescription);
  expect(toAccount.balance.value).toBe(
    toSeed.account.balance.value + dto.quantity
  );
});
