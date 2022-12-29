import * as dotenv from 'dotenv';
dotenv.config();
import { AppSyncClient } from '../AppSyncClient';
import gql from 'graphql-tag';
import { dateFormat } from '../../../utils/test';

const appsync = new AppSyncClient();

it('should return error fields: message, errorType and errorInfo', async () => {
  const response = await appsync.send({
    query: gql`
      query ($userId: ID!) {
        getAccountByUserId(userId: $userId) {
          response_time
        }
      }
    `,
    variables: { userId: 'invalid userId' },
  });

  expect(response.status).toBe(200);
  const json = await response.json();

  expect(json).toMatchObject({
    data: {
      getAccountByUserId: null,
    },
    errors: [
      {
        data: null,
        errorType: expect.any(String),
        errorInfo: {
          errorType: expect.any(String),
          time: expect.stringMatching(dateFormat),
          errorMessage: expect.any(String),
        },
        message: expect.not.stringContaining(
          'A custom error was thrown from a mapping template.'
        ), // if <message> is not a string in $util.error(<message>, ...), AppSync returns this text
      },
    ],
  });
});
