import * as dotenv from 'dotenv';
dotenv.config();
import { AppSync, getNewUserDto } from '../../../../shared/utils/test';
import {
  CreatedUser,
  deleteUsers,
  UserRepo,
} from '../../../../shared/utils/repos';

// Add all process.env used:
const { appsyncUrl, appsyncKey } = process.env;
if (!appsyncUrl || !appsyncKey) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

const appsync = new AppSync(appsyncUrl, appsyncKey);

const createdUsers: CreatedUser[] = [];
afterAll(async () => {
  await deleteUsers(createdUsers);
});

test('User creation', async () => {
  const newUser = getNewUserDto();
  const response = await appsync.query({
    query: `mutation MyMutation($email: AWSEmail!, $password: String!, $username: String!, $alias: String) {
      createUser(email: $email, password: $password, username: $username, alias: $alias) {
        result {
          id
        }
        time
      }
    }`,
    variables: newUser,
  });

  expect(response.status).toBe(200);

  const user = await UserRepo.findUserByUsername(newUser.username);
  if (!user) throw new Error(`User not found`);

  expect(user.username.value).toEqual(newUser.username);
  expect(user.email.value).toEqual(newUser.email);
  expect(user.alias.value).toEqual(newUser.alias);
  createdUsers.push({ id: user.id.toString() });
});
