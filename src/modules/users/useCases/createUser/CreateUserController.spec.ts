import { CreateUserController } from './CreateUserController';
import { UserRepoFake } from '../../repos/implementations/fake';
import { CreateUserDTO } from './CreateUserDTO';
import { DispatcherFake } from '../../../../core/infra/DispatcherFake';
import { APIGatewayEvent, Context } from 'aws-lambda';

let userRepoFake, createUserController: CreateUserController;
beforeAll(() => {
  userRepoFake = new UserRepoFake();
  createUserController = new CreateUserController(
    userRepoFake,
    new DispatcherFake()
  );
});

test('User creation', async () => {
  const validData = {
    username: 'test_username',
    email: 'test@email.com',
    password: 'passwordd',
  };

  const result = await createUserController.executeImpl(validData);

  expect(result.statusCode).toBe(201);
});

test.each([
  ['username', 'CreateNameErrors.NameNotDefined'],
  ['email', 'CreateEmailErrors.EmailNotDefined'],
  ['password', 'CreatePasswordErrors.PasswordNotDefined'],
])(
  'User creation without %s fails with %s',
  async (field: string, errorType: string) => {
    const badData: CreateUserDTO = {
      username: 'test_username',
      email: 'test@email.com',
      password: 'passwordd',
    };
    delete badData[field as 'username' | 'email' | 'password'];

    const result = await createUserController.executeImpl(badData);

    expect(result.statusCode).toBe(400);
    expect(result.body).toContain(errorType);
  }
);

test('User creation fails for taken email', async () => {
  const validData = {
    username: 'test_username',
    email: 'already@taken.com',
    password: 'passwordd',
  };

  const result = await createUserController.executeImpl(validData);

  expect(result.statusCode).toBe(409);
  expect(result.body).toContain('CreateUserErrors.EmailAlreadyTaken');
});

test('User creation fails for taken username', async () => {
  const validData = {
    username: 'taken_username',
    email: 'test@email.com',
    password: 'passwordd',
  };

  const result = await createUserController.executeImpl(validData);

  expect(result.statusCode).toBe(409);
  expect(result.body).toContain('CreateUserErrors.UsernameAlreadyTaken');
});

test('User creation fails for non-parsable string', async () => {
  const event = {
    body: 'non-parsable',
  };

  const result = await createUserController.execute(
    event as APIGatewayEvent,
    {} as Context
  );

  expect(result.statusCode).toBe(400);
  expect(result.body).toContain('MalformedRequest');
});
