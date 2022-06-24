import '../../../../../environment';
import * as dotenv from 'dotenv';
import { TextEncoder, TextDecoder } from 'util';
import { promises as fs } from 'fs';
import { Lambda } from '@aws-sdk/client-lambda';
import stringify = require('json-stringify-safe');
import Chance = require('chance');
import DynamoDB = require('aws-sdk/clients/dynamodb');

const lambdaClient = new Lambda({});
let DocumentClient: DynamoDB.DocumentClient;
const chance = new Chance();

beforeAll(async () => {
  const stage = await fs.readFile(`./.sst/stage`, 'utf8');
  dotenv.config({ path: `./.env.${stage}` });

  // Add all process.env used:
  const { UsersTable, createUser, AWS_REGION } = process.env;
  if (!UsersTable || !createUser || !AWS_REGION) {
    console.log('process.env', process.env);
    throw new Error(`Undefined env var!`);
  }
  DocumentClient = new DynamoDB.DocumentClient({ region: AWS_REGION });
});

const createdUsers: Record<string, string>[] = [];
const getNewUser = () => ({
  username: chance.first(),
  email: chance.email(),
  password: 'passwordd',
  alias: 'test_alias',
});
const parsePayload = (payload?: Uint8Array) => {
  const decoded = new TextDecoder().decode(payload);
  console.log('decoded', decoded);
  const parsed = JSON.parse(decoded);
  parsed.body = JSON.parse(parsed.body);
  return parsed;
};

afterAll(async () => {
  createdUsers.map(async (u) => {
    return await DocumentClient.delete({
      TableName: process.env.UsersTable,
      Key: {
        ...u,
      },
    }).promise();
  });
});

test('User creation', async () => {
  const newUser = getNewUser();
  const req = {
    FunctionName: process.env.createUser,
    Payload: new TextEncoder().encode(stringify(newUser)),
  };

  const result = await lambdaClient.invoke(req);

  const parsed = parsePayload(result.Payload);
  createdUsers.push({ id: parsed.body.result.id });
  expect(parsed.statusCode).toBe(201);
});
