import * as dotenv from 'dotenv';
dotenv.config();
import DynamoDB from 'aws-sdk/clients/dynamodb';
import fetch from 'node-fetch';
import { deleteUsers, getNewUser } from '../../utils/testUtils';

// Add all process.env used:
const { AWS_REGION, apiUrl } = process.env;
if (!AWS_REGION || !apiUrl) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

const DocumentClient = new DynamoDB.DocumentClient({ region: AWS_REGION });

const createdUsers: { id: string }[] = [];
afterAll(async () => {
  deleteUsers(createdUsers, DocumentClient);
});

test('User creation', async () => {
  const response = await fetch(process.env.apiUrl + '/createUser', {
    method: 'post',
    body: JSON.stringify(getNewUser()),
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();

  expect(response.status).toBe(201);
  expect(data).toMatchObject({
    result: {
      id: expect.any(String),
    },
    time: expect.any(String),
  });

  createdUsers.push({ id: data.result.id });
});
