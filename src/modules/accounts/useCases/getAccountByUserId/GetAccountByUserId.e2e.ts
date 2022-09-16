import * as dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';
import {
  AccountRepo,
  createUserAndAccount,
  deleteUsers,
} from '../../../../shared/utils/repos';
import { Account } from '../../domain/Account';

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

it('gets an account', async () => {
  const response = await fetch(apiUrl + `/getAccountByUserId?userId=${seed.userId}`, {
    method: 'get',
  });

  expect(response.status).toBe(200);

  const account = await AccountRepo.getAccountByUserId(seed.userId);
  if (!account) throw new Error(`Account not found for userId ${seed.userId}`);
  expect(account.transactions.length).toBe(1);  // Initial transaction when seeding
  expect(account.transactions[0].balance.value).toBe(0);
});
