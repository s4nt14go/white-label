import * as dotenv from 'dotenv';
dotenv.config();
import 'aws-testing-library/lib/jest';
import { TextEncoder } from 'util';
import { Lambda } from '@aws-sdk/client-lambda';
import stringify from 'json-stringify-safe';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import { deleteUsers, getNewUser, parsePayload } from '../../utils/testUtils';

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

const DocumentClient = new DynamoDB.DocumentClient({ region: AWS_REGION });

const createdUsers: { id: string }[] = [];
afterAll(async () => {
  deleteUsers(createdUsers, DocumentClient);
});

test('User creation', async () => {
  const { createUser, AWS_REGION, UsersTable } = process.env;
  const newUser = getNewUser();
  const req = {
    FunctionName: createUser,
    Payload: new TextEncoder().encode(stringify(newUser)),
  };

  const result = await lambdaClient.invoke(req);

  const parsed = parsePayload(result.Payload);
  createdUsers.push({ id: parsed.body.result.id });
  expect(parsed.statusCode).toBe(201);

  await expect({
    region: AWS_REGION,
    table: UsersTable,
    timeout: 10000,
  }).toHaveItem(
    { id: parsed.body.result.id },
    expect.objectContaining({
      ...newUser,
      password: expect.any(String),
    })
  );

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
