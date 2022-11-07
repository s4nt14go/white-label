import * as dotenv from 'dotenv';
dotenv.config();
import gql from 'graphql-tag';
import { AppSyncClient } from '../AppSyncClient';
import Chance from 'chance';
import { deleteItems } from '../../../utils/test';
import { NotificationTypes } from '../../../../modules/notification/domain/NotificationTypes';

const appsync = new AppSyncClient();
const chance = new Chance();

// Add all process.env used:
const { NotificationsTable } = process.env;
if (!NotificationsTable) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

let notification: {
  type: NotificationTypes;
  id: string;
};
afterAll(async () => {
  await deleteItems([notification], NotificationsTable);
});

test('error should show error type and message', async () => {
  const id = chance.guid();
  const variables = {
    type: 'TransactionCreated',
    id,
    accountId: '12345678-1234-1234-1234-123456789012',
    target: 'FE',
    balance: 12,
    date: '2020-01-20T08:00:00.000Z',
    delta: 2,
    description: 'description',
  };
  const query = gql`
    mutation (
      $target: NotificationTargets!
      $type: NotificationTypes!
      $accountId: ID!
      $balance: Float!
      $date: AWSDateTime!
      $delta: Float!
      $description: String!
      $id: ID!
    ) {
      notifyTransactionCreated(
        data: {
          target: $target
          type: $type
          accountId: $accountId
          transaction: {
            balance: $balance
            date: $date
            delta: $delta
            description: $description
            id: $id
          }
        }
      ) {
        transaction {
          id
        }
      }
    }
  `;
  const firstResponse = await appsync.send({
    query,
    variables,
  });

  expect(firstResponse.status).toBe(200);
  let json = await firstResponse.json();

  expect(json).toStrictEqual({
    data: {
      notifyTransactionCreated: {
        transaction: {
          id,
        },
      },
    },
  });

  notification = {
    type: NotificationTypes.TransactionCreated,
    id,
  };

  const secondResponse = await appsync.send({
    query,
    variables,
  });

  expect(secondResponse.status).toBe(200);
  json = await secondResponse.json();

  expect(json).toMatchObject({
    data: null,
    errors: [
      {
        path: ['notifyTransactionCreated'],
        data: null,
        errorType: 'DynamoDB:ConditionalCheckFailedException',
        message: expect.stringContaining('The conditional request failed'),
      },
    ],
  });
});
