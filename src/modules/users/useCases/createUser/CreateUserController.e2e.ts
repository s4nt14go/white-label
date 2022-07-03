import * as dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';
import {
  CreatedUser,
  deleteUsers,
  findByUsernameWithRetry,
  getNewUser,
} from '../../utils/testUtils';

// Add all process.env used:
const { AWS_REGION, apiUrl, UsersTable } = process.env;
if (!AWS_REGION || !apiUrl || !UsersTable) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

const createdUsers: CreatedUser[] = [];
afterAll(async () => {
  deleteUsers(createdUsers, UsersTable, AWS_REGION);
});

test('User creation', async () => {
  const newUser = getNewUser();
  const response = await fetch(process.env.apiUrl + '/createUser', {
    method: 'post',
    body: JSON.stringify(newUser),
    headers: { 'Content-Type': 'application/json' },
  });

  expect(response.status).toBe(201);

  const user = await findByUsernameWithRetry(newUser.username, 2);

  expect(user.username.value).toEqual(newUser.username);
  expect(user.email.value).toEqual(newUser.email);
  expect(user.alias.value).toEqual(newUser.alias);
  createdUsers.push({ id: user.id.toString() });
});
