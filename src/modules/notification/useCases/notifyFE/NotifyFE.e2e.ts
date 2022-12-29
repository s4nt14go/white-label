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
import { createUserAndAccount, deleteUsers } from '../../../../shared/utils/repos';
import { Account } from '../../../accounts/domain/Account';
import { Request } from '../../../accounts/useCases/createTransaction/CreateTransactionDTOs';
import {
  addDecimals,
  dateFormat,
  deleteItems,
  getByPart,
  getRandom,
  retryDefault,
} from '../../../../shared/utils/test';
import Chance from 'chance';
import { AppSyncClient } from '../../../../shared/infra/appsync/AppSyncClient';
import { NotificationTypes } from '../../domain/NotificationTypes';
import { NotificationTargets } from '../../domain/NotificationTargets';
import { User } from '../../../users/domain/User';

const appsync = new AppSyncClient();
const chance = new Chance();

// Add all process.env used:
const { appsyncUrl, appsyncKey, AWS_REGION, NotificationsTable, StorageTable } =
  process.env;
if (
  !appsyncUrl ||
  !appsyncKey ||
  !AWS_REGION ||
  !NotificationsTable ||
  !StorageTable
) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

let seed: { user: User; account: Account }, seedUserId: string;
let client, subscription: ZenObservable.Subscription;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const notifications: Record<string, any>[] = [];
beforeAll(async () => {
  seed = await createUserAndAccount();
  seedUserId = seed.user.id.toString();

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
            target
            type
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

  await new Promise((resolve) => setTimeout(resolve, 3000)); // Give some time to the subscription
});

let auditEvents: Record<string, unknown>[];
let transactionId: number;
afterAll(async () => {
  await deleteUsers([{ id: seedUserId }]);
  await deleteItems(
    [
      {
        type: NotificationTypes.TransactionCreated,
        id: transactionId,
      },
    ],
    NotificationsTable
  );
  await deleteItems(
    auditEvents.map((event) => {
      const { typeAggregateId, dateTimeOccurred } = event;
      return {
        typeAggregateId,
        dateTimeOccurred,
      };
    }),
    StorageTable
  );
  subscription.unsubscribe();
});

test('Create transaction', async () => {
  const dto: Request = {
    userId: seedUserId,
    description: `Test: ${chance.sentence()}`,
    delta: getRandom({ min: 0 }),
  };
  const response = await appsync.send({
    query: gql`
      mutation ($userId: ID!, $description: String!, $delta: Float!) {
        createTransaction(
          userId: $userId
          description: $description
          delta: $delta
        ) {
          __typename
        }
      }
    `,
    variables: dto,
  });

  expect(response.status).toBe(200);

  await retry(async () => {
    if (notifications.length) {
      console.log(`Notifications collected:`, notifications);
      console.log(`...when dto is:`, dto);
    }
    const accountId = seed.account.id.toString();
    expect(notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          accountId,
          target: NotificationTargets.FE,
          type: NotificationTypes.TransactionCreated,
          transaction: expect.objectContaining({
            balance: addDecimals(seed.account.balance().value, dto.delta),
            delta: dto.delta,
            date: expect.stringMatching(dateFormat),
            description: dto.description,
            id: expect.any(String),
          }),
        }),
      ])
    );

    transactionId = notifications.filter((n) => n.accountId === accountId)[0]
      .transaction.id;

    const partValue = `TransactionCreatedEvent#${accountId}`;
    const got = await getByPart('typeAggregateId', partValue, StorageTable);
    if (!got) throw Error(`No audit events found for ${partValue}`);
    auditEvents = got;
    expect(auditEvents).toHaveLength(1);
  }, retryDefault);
});
