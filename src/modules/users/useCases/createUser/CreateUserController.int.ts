import * as dotenv from 'dotenv';
dotenv.config();
import 'aws-testing-library/lib/jest';
import { TextEncoder } from 'util';
import { Lambda } from '@aws-sdk/client-lambda';
import stringify from 'json-stringify-safe';
import {
  CreatedUser,
  deleteUsers,
  findByUsernameWithRetry,
  getNewUser,
  parsePayload,
} from '../../utils/testUtils';

const lambdaClient = new Lambda({});

// Add all process.env used:
const { UsersTable, createUser, AWS_REGION, notifySlackChannel, someWork } =
  process.env;
if (
  !UsersTable ||
  !createUser ||
  !AWS_REGION ||
  !notifySlackChannel ||
  !someWork
) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

const createdUsers: CreatedUser[] = [];
afterAll(async () => {
  deleteUsers(createdUsers, UsersTable, AWS_REGION);
});

test('User creation', async () => {
  const { createUser, AWS_REGION } = process.env;
  const newUser = getNewUser();
  const req = {
    FunctionName: createUser,
    Payload: new TextEncoder().encode(stringify(newUser)),
  };

  const result = await lambdaClient.invoke(req);

  const parsed = parsePayload(result.Payload);
  expect(parsed.statusCode).toBe(201);

  const user = await findByUsernameWithRetry(newUser.username, 2);

  expect(user.username.value).toEqual(newUser.username);
  expect(user.email.value).toEqual(newUser.email);
  expect(user.alias.value).toEqual(newUser.alias);
  createdUsers.push({ id: user.id.toString() });

  await expect({
    region: AWS_REGION,
    function: notifySlackChannel,
    timeout: 10000,
  }).toHaveLog(
    `SlackService.sendMessage finished without errors` &&
      `${newUser.username}` &&
      `${newUser.email}`
  );

  await expect({
    region: AWS_REGION,
    function: someWork,
    timeout: 10000,
  }).toHaveLog(
    `ExternalService.sendToExternal finished without errors` &&
      `${newUser.username}` &&
      `${newUser.email}`
  );
});
