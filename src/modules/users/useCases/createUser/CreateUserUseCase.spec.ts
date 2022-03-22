import { CreateUserUseCase } from './CreateUserUseCase';
import { UserRepoFake } from '../../repos/implementations/fake';
import { CreateUserDTO } from './CreateUserDTO';

let userRepoFake, createUserUseCase: CreateUserUseCase;
beforeAll(() => {
  userRepoFake = new UserRepoFake();
  createUserUseCase = new CreateUserUseCase(userRepoFake);
})

test('User creation', async () => {
  const validData = {
    username: 'test_username',
    email: 'test@email.com',
    password: 'passwordd',
  }

  const result = await createUserUseCase.execute(validData);

  expect(result.value.isSuccess).toBe(true);

});

test.each(['username', 'email', 'password'])('User creation fails without %p', async (field: string) => {
  const badData: CreateUserDTO = {
    username: 'test_username',
    email: 'test@email.com',
    password: 'passwordd',
  };
  delete badData[field as 'username' | 'email' | 'password'];

  const result = await createUserUseCase.execute(badData);

  expect(result.value.isFailure).toBe(true);
  expect(result.value.error).toContain(field);
});

test('User creation fails for taken email', async () => {
  const validData = {
    username: 'test_username',
    email: 'already@taken.com',
    password: 'passwordd',
  }

  const result = await createUserUseCase.execute(validData);

  expect(result.value.isFailure).toBe(true);
  expect(result.value.constructor.name).toBe('EmailAlreadyExistsError');
});

test('User creation fails when saving to DB fails', async () => {
  const validData = {
    username: 'FAIL WHEN SAVE',
    email: 'test@email.com',
    password: 'passwordd',
  }

  const result = await createUserUseCase.execute(validData);

  expect(result.value.isFailure).toBe(true);
  expect(result.value.constructor.name).toBe('UnexpectedError');
});
