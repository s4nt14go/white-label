import * as dotenv from 'dotenv';
dotenv.config();
import 'aws-testing-library/lib/jest';
import {
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
const { createUser, AWS_REGION, notifySlackChannel, someWork } = process.env;
if (!createUser || !AWS_REGION || !notifySlackChannel || !someWork) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

const createdUsers: CreatedUser[] = [];
afterAll(async () => {
  await deleteUsers(createdUsers);
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
  createdUsers.push({ id: user.id.toString() });

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
  // Side effect in module accounts
  const accountCreated = await AccountRepo.getAccountByUserId(user.id.toString());
  if (!accountCreated) throw Error('Account not created');
  expect(accountCreated.balance.value).toBe(0);
  expect(accountCreated.active).toBe(true);
  expect(accountCreated.transactions).toHaveLength(1);
  expect(accountCreated.transactions[0].balance.value).toBe(0);
});
