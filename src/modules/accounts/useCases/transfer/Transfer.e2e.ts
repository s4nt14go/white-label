import * as dotenv from 'dotenv';
dotenv.config();
import {
  AccountRepo,
  createUserAndAccount,
  deleteUsers,
} from '../../../../shared/utils/repos';
import { Account } from '../../domain/Account';
import { Request } from './TransferDTO';
import Chance from 'chance';
import { Transaction } from '../../domain/Transaction';
import { Amount } from '../../domain/Amount';
import { Description } from '../../domain/Description';
import { AppSync } from '../../../../shared/utils/test';

const chance = new Chance();

// Add all process.env used:
const { appsyncUrl, appsyncKey } = process.env;
if (!appsyncUrl || !appsyncKey) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

const appsync = new AppSync(appsyncUrl, appsyncKey);

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
  const dto: Request = {
    fromUserId: fromSeed.userId,
    fromDescription: `Test: ${chance.sentence()}`,
    toUserId: toSeed.userId,
    toDescription: `Test: ${chance.sentence()}`,
    quantity: 50,
  };
  const response = await appsync.query({
    query: `mutation MyMutation($fromDescription: String!, $fromUserId: ID!, $quantity: Float!, $toUserId: ID!, $toDescription: String) {
      transfer(fromDescription: $fromDescription, fromUserId: $fromUserId, quantity: $quantity, toUserId: $toUserId, toDescription: $toDescription) {
        response_time
      }
    }`,
    variables: dto,
  });

  expect(response.status).toBe(200);
  const json = await response.json();
  expect(json.data.transfer).toMatchObject({
    response_time: expect.any(String),
  });
  expect(json).not.toMatchObject({
    errors: expect.anything(),
  });
});
