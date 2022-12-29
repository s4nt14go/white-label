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
import { User } from '../../../users/domain/User';
import { dateFormat } from '../../../../shared/utils/test';

const appsync = new AppSyncClient();

let seed: { user: User, account: Account }, seedUserId : string;
beforeAll(async () => {
  seed = await createUserAndAccount();
  seedUserId = seed.user.id.toString();
});

afterAll(async () => {
  await deleteUsers([{ id: seedUserId }]);
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
    variables: { userId: seedUserId },
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
    response_time: expect.stringMatching(dateFormat),
  });
  expect(json).not.toMatchObject({
    errors: expect.anything(),
  });

  const accountDB = await AccountRepo.getAccountByUserId(seedUserId);
  if (!accountDB) throw new Error(`Account not found for userId ${seedUserId}`);
  expect(accountDB.transactions.length).toBe(1); // Initial transaction when seeding
  expect(accountDB.transactions[0].balance.value).toBe(0);
});
