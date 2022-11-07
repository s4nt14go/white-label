import * as dotenv from 'dotenv';
dotenv.config();
import 'aws-testing-library/lib/jest';
import {
  deleteItems,
  getByPart,
  getAppSyncEvent as getEvent,
  getNewUserDto,
  invokeLambda,
} from '../../../../shared/utils/test';
import {
  CreatedUser,
  deleteUsers,
  UserRepo,
  AccountRepo,
} from '../../../../shared/utils/repos';

// Add all process.env used:
const {
  createUser,
  AWS_REGION,
  notifySlackChannel,
  someWork,
  StorageTable,
} = process.env;
if (!createUser || !AWS_REGION || !notifySlackChannel || !someWork || !StorageTable) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

const createdUsers: CreatedUser[] = [];
let auditEvent: Record<string, unknown>;
afterAll(async () => {
  await deleteUsers(createdUsers);
  const Key = {
    typeAggregateId: auditEvent.typeAggregateId,
    dateTimeOccurred: auditEvent.dateTimeOccurred,
  }
  await deleteItems([Key], StorageTable);
});

test('User creation', async () => {
  const newUser = getNewUserDto();
  const invoked = await invokeLambda(getEvent(newUser), createUser);

  console.log('invoked', invoked);
  expect(invoked).not.toMatchObject({
    error: expect.anything(),
  });
  expect(invoked.result).toMatchObject({
    id: expect.any(String),
  });

  const user = await UserRepo.findUserByUsername(newUser.username);
  if (!user) throw new Error(`User not found`);

  expect(user.username.value).toEqual(newUser.username);
  expect(user.email.value).toEqual(newUser.email);
  expect(user.alias.value).toEqual(newUser.alias);
  const id = user.id.toString();
  createdUsers.push({ id });

  if (!process.env.IS_LOCAL) {
    // Side effect in module notification
    await expect({
      region: AWS_REGION,
      function: notifySlackChannel,
      timeout: 12000,
    }).toHaveLog(
      `SlackService.sendMessage finished without errors` &&
      `${newUser.username}` &&
      `${newUser.email}`
    );
    // Side effect in service someWork
    await expect({
      region: AWS_REGION,
      function: someWork,
      timeout: 12000,
    }).toHaveLog(
      `ExternalService.sendToExternal finished without errors` &&
      `${newUser.username}` &&
      `${newUser.email}`
    );
  } else {
    console.log(`CloudWatch logs aren't written when SST is running locally`);
  }
  // Side effect in module accounts
  const accountCreated = await AccountRepo.getAccountByUserId(id);
  if (!accountCreated) throw Error(`Account not created for ${id}`);
  expect(accountCreated.balance().value).toBe(0);
  expect(accountCreated.active).toBe(true);
  expect(accountCreated.transactions).toHaveLength(1);
  expect(accountCreated.transactions[0].balance.value).toBe(0);
  // Side effects in audit module
  const partValue = `UserCreatedEvent#${id}`;
  const items = await getByPart('typeAggregateId', partValue, StorageTable);
  if (!items) throw Error(`No audit events found for ${partValue}`);
  expect(items).toHaveLength(1);
  auditEvent = items[0];
  expect(auditEvent).toMatchObject({
    typeAggregateId: partValue,
    username: newUser.username,
    email: newUser.email,
  });
});
