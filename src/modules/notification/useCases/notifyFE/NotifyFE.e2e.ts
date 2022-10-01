//#region Dependencies to test AppSync subscriptions
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.WebSocket = require('ws');
require('isomorphic-fetch');
import gql from 'graphql-tag';
import retry from 'async-retry';
import { AUTH_TYPE, AWSAppSyncClient } from 'aws-appsync';
import { ZenObservable } from 'zen-observable-ts';
//#endregion
import * as dotenv from 'dotenv';
dotenv.config();
import {
  AccountRepo,
  createUserAndAccount,
  deleteUsers,
} from '../../../../shared/utils/repos';
import { Account } from '../../../accounts/domain/Account';
import { Request } from '../../../accounts/useCases/createTransaction/CreateTransactionDTO';
import { addDecimals } from '../../../../shared/utils/test';
import Chance from 'chance';
import { AppSyncClient } from '../../../../shared/infra/appsync/AppSyncClient';
import { NotifyTransactionCreated } from '../../../../shared/infra/appsync/schema.graphql';

const appsync = new AppSyncClient();
const chance = new Chance();

// Add all process.env used:
const { appsyncUrl, appsyncKey, AWS_REGION } = process.env;
if (!appsyncUrl || !appsyncKey || !AWS_REGION) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

let seed: { userId: string; account: Account };
let client, subscription: ZenObservable.Subscription;
const notifications: NotifyTransactionCreated[] = [];
beforeAll(async () => {
  seed = await createUserAndAccount();

  client = new AWSAppSyncClient({
    url: appsyncUrl,
    region: AWS_REGION,
    auth: {
      type: AUTH_TYPE.API_KEY,
      apiKey: appsyncKey,
    },
    disableOffline: true,
  });

  subscription = client
    .subscribe({
      query: gql`
        subscription onNotifyTransactionCreated {
          onNotifyTransactionCreated {
            accountId
            transaction {
              id
              balance
              delta
              description
              date
            }
          }
        }
      `,
    })
    .subscribe({
      next: (resp) => {
        console.log('subscription data:', resp);
        notifications.push(resp.data.onNotifyTransactionCreated);
      },
    });

  await new Promise(resolve => setTimeout(resolve, 3000));  // Give some time to the subscription
});

afterAll(async () => {
  await AccountRepo.deleteByUserId(seed.userId);
  await deleteUsers([{ id: seed.userId }]);

  subscription.unsubscribe();
});

test('Create transaction', async () => {
  const dto: Request = {
    userId: seed.userId,
    description: `Test: ${chance.sentence()}`,
    delta: chance.floating({ min: 0, fixed: 2 }),
  };
  const response = await appsync.send({
    query: gql`
      mutation ($userId: ID!, $description: String!, $delta: Float!) {
        createTransaction(
          userId: $userId
          description: $description
          delta: $delta
        ) {
          response_time
        }
      }
    `,
    variables: dto,
  });

  expect(response.status).toBe(200);

  await retry(
    async () => {
      if (notifications.length) {
        console.log(`Notifications collected:`, notifications);
        console.log(`...when dto is:`, dto);
      }
      expect(notifications).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            accountId: seed.account.id.toString(),
            transaction: expect.objectContaining({
              balance: addDecimals(seed.account.balance.value, dto.delta),
              delta: dto.delta,
              date: expect.any(String),
              description: dto.description,
              id: expect.any(String),
            }),
          }),
        ])
      );
    },
    {
      retries: 10,
      maxTimeout: 1000,
    }
  );
});
