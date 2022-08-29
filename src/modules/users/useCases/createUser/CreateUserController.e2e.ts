import * as dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';
import {
  CreatedUser,
  deleteUsers,
  getNewUser,
  repo,
} from '../../../../shared/utils/test';

// Add all process.env used:
const { apiUrl } = process.env;
if (!apiUrl) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

const createdUsers: CreatedUser[] = [];
afterAll(async () => {
  await deleteUsers(createdUsers);
});

test('User creation', async () => {
  const newUser = getNewUser();
  const response = await fetch(process.env.apiUrl + '/createUser', {
    method: 'post',
    body: JSON.stringify(newUser),
    headers: { 'Content-Type': 'application/json' },
  });

  expect(response.status).toBe(201);

  const user = await repo.findUserByUsername(newUser.username);
  if (!user) throw new Error(`User not found`);

  expect(user.username.value).toEqual(newUser.username);
  expect(user.email.value).toEqual(newUser.email);
  expect(user.alias.value).toEqual(newUser.alias);
  createdUsers.push({ id: user.id.toString() });
});
