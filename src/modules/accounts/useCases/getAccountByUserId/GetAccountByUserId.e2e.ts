import * as dotenv from 'dotenv';
dotenv.config();
import {
  AccountRepo,
  createUserAndAccount,
  deleteUsers,
} from '../../../../shared/utils/repos';
import { Account } from '../../domain/Account';
import { AppSyncClient } from '../../../../shared/infra/appsync/AppSyncClient';
import { GraphQLresponse } from '../../../../shared/utils/graphQLresponseTypes';

const appsync = new AppSyncClient();

let seed: { userId: string; account: Account };
beforeAll(async () => {
  seed = await createUserAndAccount();
});

afterAll(async () => {
  await AccountRepo.deleteByUserId(seed.userId);
  await deleteUsers([{ id: seed.userId }]);
});

it('gets an account', async () => {
  const response = await appsync.send({
    query: `query ($userId: ID!) { 
        getAccountByUserId(userId: $userId) { 
          balance 
          active 
          transactions { 
            balance 
            delta 
            date 
          } 
          response_time 
        } 
      }`,
    variables: { userId: seed.userId },
  });

  expect(response.status).toBe(200);
  const json = (await response.json()) as GraphQLresponse;
  expect(json.data.getAccountByUserId.balance).toBe(0);

  const account = await AccountRepo.getAccountByUserId(seed.userId);
  if (!account) throw new Error(`Account not found for userId ${seed.userId}`);
  expect(account.transactions.length).toBe(1); // Initial transaction when seeding
  expect(account.transactions[0].balance.value).toBe(0);
});
