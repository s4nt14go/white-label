import { CreateUser } from './CreateUser';
import { UserRepoFake } from '../../repos/UserRepoFake';
import { DispatcherFake } from '../../../../shared/infra/dispatchEvents/DispatcherFake';
import { Context } from 'aws-lambda';
import {
  fakeTransaction,
  getAppSyncEvent as getEvent,
} from '../../../../shared/utils/test';

let userRepo, createUser: CreateUser;
beforeAll(() => {
  userRepo = new UserRepoFake();
  createUser = new CreateUser(
    userRepo,
    new DispatcherFake(),
    {},
    fakeTransaction,
  );
});

const context = {} as unknown as Context;
test('User creation with alias', async () => {
  const validData = {
    username: 'test_username',
    email: 'test@email.com',
    password: 'passwordd',
    alias: 'test_alias',
  };

  const result = await createUser.execute(
    getEvent(validData),
    context
  );

  expect(result).toMatchObject({
    time: expect.any(String),
  });
  expect(result).not.toMatchObject({
    error: expect.anything(),
  });
});

test('User creation without alias', async () => {
  const validData = {
    username: 'test_username',
    email: 'test@email.com',
    password: 'passwordd',
  };

  const result = await createUser.execute(
    getEvent(validData),
    context
  );

  expect(result).toMatchObject({
    time: expect.any(String),
  });
  expect(result).not.toMatchObject({
    error: expect.anything(),
  });
});

test.each([
  ['username', 'CreateNameErrors.NameNotDefined'],
  ['email', 'CreateEmailErrors.EmailNotDefined'],
  ['password', 'CreatePasswordErrors.PasswordNotDefined'],
])(
  'User creation without %s fails with %s',
  async (field: string, errorType: string) => {
    const badData = {
      username: 'test_username',
      email: 'test@email.com',
      password: 'passwordd',
    };
    delete badData[field as 'username' | 'email' | 'password'];

    const result = await createUser.execute(
      getEvent(badData),
      context
    );

    expect(result).toMatchObject({
      error: {
        errorType,
      },
    });
  }
);

test('User creation fails for taken email', async () => {
  const data = {
    username: 'test_username',
    email: 'already@taken.com',
    password: 'passwordd',
  };

  const result = await createUser.execute(
    getEvent(data),
    context
  );

  expect(result).toMatchObject({
    error: {
      errorType: 'CreateUserErrors.EmailAlreadyTaken',
    },
  });
});

test('User creation fails for taken username', async () => {
  const data = {
    username: 'taken_username',
    email: 'test@email.com',
    password: 'passwordd',
  };

  const result = await createUser.execute(
    getEvent(data),
    context
  );

  expect(result).toMatchObject({
    error: {
      errorType: 'CreateUserErrors.UsernameAlreadyTaken',
    },
  });
});
