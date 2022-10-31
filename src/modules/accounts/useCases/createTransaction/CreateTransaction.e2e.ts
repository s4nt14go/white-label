import * as dotenv from 'dotenv';
dotenv.config();
import {
  AccountRepo,
  createUserAndAccount,
  deleteUsers,
} from '../../../../shared/utils/repos';
import { Account } from '../../domain/Account';
import { Request } from './CreateTransactionDTO';
import { MutationCreateTransactionResponse } from '../../../../shared/infra/appsync/schema.graphql';
import Chance from 'chance';
import { AppSyncClient } from '../../../../shared/infra/appsync/AppSyncClient';
import gql from 'graphql-tag';
import { getRandom } from '../../../../shared/utils/test';

const appsync = new AppSyncClient();
const chance = new Chance();

// Add all process.env used:
const { appsyncUrl, appsyncKey } = process.env;
if (!appsyncUrl || !appsyncKey) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

let seed: { userId: string; account: Account };
beforeAll(async () => {
  seed = await createUserAndAccount();
});

afterAll(async () => {
  await deleteUsers([{ id: seed.userId }]);
});

test('Create transaction', async () => {
  const dto: Request = {
    userId: seed.userId,
    description: `Test: ${chance.sentence()}`,
    delta: getRandom({min: 0}),
  };
  const response = await appsync.send({
    query: gql`
      mutation ($userId: ID!, $description: String!, $delta: Float!) {
        createTransaction(
          userId: $userId
          description: $description
          delta: $delta
        ) {
          id
          response_time
        }
      }
    `,
    variables: dto,
  });

  expect(response.status).toBe(200);
  const json = (await response.json()) as MutationCreateTransactionResponse;
  expect(json.data.createTransaction).toMatchObject({
    id: expect.any(String),
    response_time: expect.any(String),
  });
  expect(json).not.toMatchObject({
    errors: expect.anything(),
  });

  const account = await AccountRepo.getAccountByUserId(seed.userId);
  if (!account) throw new Error(`Account not found for userId ${seed.userId}`);
  expect(account.transactions.length).toBe(2); // Initial transaction when seeding with createUserAndAccount and the created one
  expect(account.transactions[0].balance.value).toBe(
    seed.account.balance().value + dto.delta
  );
  expect(account.transactions[0].delta.value).toBe(dto.delta);
  expect(account.transactions[0].description.value).toBe(dto.description);
  expect(account.balance().value).toBe(seed.account.balance().value + dto.delta);
});
