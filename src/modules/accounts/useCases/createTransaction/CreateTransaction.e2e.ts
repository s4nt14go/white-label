import * as dotenv from 'dotenv';
dotenv.config();
import {
  AccountRepo,
  createUserAndAccount,
  deleteUsers,
} from '../../../../shared/utils/repos';
import { Account } from '../../domain/Account';
import { Request } from './CreateTransactionDTO';
import { AppSync } from '../../../../shared/utils/test';
import Chance from 'chance';

const chance = new Chance();

// Add all process.env used:
const { appsyncUrl, appsyncKey } = process.env;
if (!appsyncUrl || !appsyncKey) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

const appsync = new AppSync(appsyncUrl, appsyncKey);

let seed: { userId: string; account: Account };
beforeAll(async () => {
  seed = await createUserAndAccount();
});

afterAll(async () => {
  await AccountRepo.deleteByUserId(seed.userId);
  await deleteUsers([{ id: seed.userId }]);
});

test('Create transaction', async () => {
  const dto: Request = {
    userId: seed.userId,
    description: `Test: ${chance.sentence()}`,
    delta: chance.floating({ min: 0, fixed: 2 }),
  };
  const response = await appsync.query({
    query: `mutation ($userId: ID!, $description: String!, $delta: Float!) {
      createTransaction(userId: $userId, description: $description, delta: $delta) {
        time
      }
    }`,
    variables: dto,
  });

  expect(response.status).toBe(200);
  const json = await response.json();
  expect(json.data.createTransaction).toMatchObject({
    time: expect.any(String),
  });
  expect(json).not.toMatchObject({
    errors: expect.anything(),
  });

  const account = await AccountRepo.getAccountByUserId(seed.userId);
  if (!account) throw new Error(`Account not found for userId ${seed.userId}`);
  expect(account.transactions.length).toBe(2); // Initial transaction when seeding with createUserAndAccount and the created one
  expect(account.transactions[0].balance.value).toBe(
    seed.account.balance.value + dto.delta
  );
  expect(account.transactions[0].delta.value).toBe(dto.delta);
  expect(account.transactions[0].description.value).toBe(dto.description);
  expect(account.balance.value).toBe(seed.account.balance.value + dto.delta);
});
