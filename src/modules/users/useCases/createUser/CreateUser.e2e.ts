import * as dotenv from 'dotenv';
dotenv.config();
import { getNewUserDto } from '../../../../shared/utils/test';
import {
  CreatedUser,
  deleteUsers,
  UserRepo,
} from '../../../../shared/utils/repos';
import { AppSyncClient } from '../../../../shared/infra/appsync/AppSyncClient';
import gql from 'graphql-tag';

const appsync = new AppSyncClient();

const createdUsers: CreatedUser[] = [];
afterAll(async () => {
  await deleteUsers(createdUsers);
});

test('User creation', async () => {
  const newUser = getNewUserDto();
  const response = await appsync.send({
    query: gql `mutation MyMutation($email: AWSEmail!, $password: String!, $username: String!, $alias: String) {
      createUser(email: $email, password: $password, username: $username, alias: $alias) {
        id
        response_time
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
