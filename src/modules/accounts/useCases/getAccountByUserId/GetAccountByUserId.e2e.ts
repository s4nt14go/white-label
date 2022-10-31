import * as dotenv from 'dotenv';
dotenv.config();
import {
  AccountRepo,
  createUserAndAccount,
  deleteUsers,
} from '../../../../shared/utils/repos';
import { Account } from '../../domain/Account';
import { AppSyncClient } from '../../../../shared/infra/appsync/AppSyncClient';
import {
  QueryGetAccountByUserIdResponse,
} from '../../../../shared/infra/appsync/schema.graphql';
import gql from 'graphql-tag';

const appsync = new AppSyncClient();

let seed: { userId: string; account: Account };
beforeAll(async () => {
  seed = await createUserAndAccount();
});

afterAll(async () => {
  await deleteUsers([{ id: seed.userId }]);
});

it('gets an account', async () => {
  const response = await appsync.send({
    query: gql`
      query ($userId: ID!) {
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
      }
    `,
    variables: { userId: seed.userId },
  });

  expect(response.status).toBe(200);
  const json = (await response.json()) as QueryGetAccountByUserIdResponse;
  const { account } = seed;
  const { transactions } = account;
  expect(transactions).toHaveLength(1);
  const { balance, delta, date } = transactions[0];
  expect(json.data.getAccountByUserId).toMatchObject({
    balance: account.balance().value,
    active: account.active,
    transactions: expect.arrayContaining([expect.objectContaining({
      balance: balance.value,
      delta: delta.value,
      date: date.toJSON(),
    })]),
    response_time: expect.any(String),
  });
  expect(json).not.toMatchObject({
    errors: expect.anything(),
  });

  const accountDB = await AccountRepo.getAccountByUserId(seed.userId);
  if (!accountDB) throw new Error(`Account not found for userId ${seed.userId}`);
  expect(accountDB.transactions.length).toBe(1); // Initial transaction when seeding
  expect(accountDB.transactions[0].balance.value).toBe(0);
});
