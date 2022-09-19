import * as dotenv from 'dotenv';
dotenv.config();
import {
  AccountRepo,
  createUserAndAccount,
  deleteUsers,
} from '../../../../shared/utils/repos';
import { Account } from '../../domain/Account';
import { AppSync } from '../../../../shared/utils/test';

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

it('gets an account', async () => {
  const response = await appsync.query({
    query: `query ($userId: ID!) { 
        getAccountByUserId(userId: $userId) { 
          result { 
            balance 
            active 
            transactions { 
              balance 
              delta 
              date 
            } 
          } 
          time 
        } 
      }`,
    variables: { userId: seed.userId },
  });

  expect(response.status).toBe(200);
  const json = await response.json();
  expect(json.data.getAccountByUserId.result.balance).toBe(0);

  const account = await AccountRepo.getAccountByUserId(seed.userId);
  if (!account) throw new Error(`Account not found for userId ${seed.userId}`);
  expect(account.transactions.length).toBe(1); // Initial transaction when seeding
  expect(account.transactions[0].balance.value).toBe(0);
});
