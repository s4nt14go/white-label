import * as dotenv from 'dotenv';
dotenv.config();
import {
  dateFormat,
  deleteItems,
  getByPart,
  getNewUserDto,
} from '../../../../shared/utils/test';
import {
  CreatedUser,
  deleteUsers,
  UserRepo,
} from '../../../../shared/utils/repos';
import { AppSyncClient } from '../../../../shared/infra/appsync/AppSyncClient';
import gql from 'graphql-tag';
import { MutationCreateUserResponse } from '../../../../shared/infra/appsync/schema.graphql';

// Add all process.env used:
const { StorageTable } = process.env;
if (!StorageTable) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

const appsync = new AppSyncClient();

const createdUsers: CreatedUser[] = [];
let auditEvent: Record<string, unknown>;
afterAll(async () => {
  await deleteUsers(createdUsers);

  await deleteItems(
    [
      {
        typeAggregateId: auditEvent.typeAggregateId,
        dateTimeOccurred: auditEvent.dateTimeOccurred,
      },
    ],
    StorageTable
  );
});

test('User creation', async () => {
  const newUser = getNewUserDto();
  const response = await appsync.send({
    query: gql`
      mutation MyMutation(
        $email: AWSEmail!
        $password: String!
        $username: String!
        $alias: String
      ) {
        createUser(
          email: $email
          password: $password
          username: $username
          alias: $alias
        ) {
          id
          response_time
        }
      }
    `,
    variables: newUser,
  });

  expect(response.status).toBe(200);
  const json = (await response.json()) as MutationCreateUserResponse;
  expect(json.data.createUser).toMatchObject({
    id: expect.any(String),
    response_time: expect.stringMatching(dateFormat),
  });

  const user = await UserRepo.findUserByUsername(newUser.username);
  if (!user) throw new Error(`User not found`);

  expect(user.username.value).toEqual(newUser.username);
  expect(user.email.value).toEqual(newUser.email);
  expect(user.alias.value).toEqual(newUser.alias);
  const id = user.id.toString();
  createdUsers.push({ id });

  const partValue = `UserCreatedEvent#${id}`;
  const items = await getByPart('typeAggregateId', partValue, StorageTable);
  if (!items) throw Error(`No audit events found for ${partValue}`);
  expect(items).toHaveLength(1);
  auditEvent = items[0];
});
