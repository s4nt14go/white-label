import { CreateUserUseCase } from './CreateUserUseCase';
import { UserRepoFake } from '../../repos/implementations/fake';

let userRepoFake, createUserUseCase;
beforeAll(() => {
  userRepoFake = new UserRepoFake();
  createUserUseCase = new CreateUserUseCase(userRepoFake);
})

test('User creation', async () => {
  const validData = {
    firstName: 'John',
    lastName: 'Smith',
    email: 'js@gmail.com',
    password: 'passwordd',
  }

  const result = await createUserUseCase.execute(validData);

  expect(result.value.isSuccess).toBe(true);

});

test.each(['firstName', 'lastName', 'email', 'password'])('User creation fails without %p', async (field) => {
  const badData = {
    firstName: 'John',
    lastName: 'Smith',
    email: 'js@gmail.com',
    password: 'passwordd',
  };
  delete badData[field];

  const result = await createUserUseCase.execute(badData);

  expect(result.value.isFailure).toBe(true);
  expect(result.value.error).toContain(field);
});

test('User creation fails for taken email', async () => {
  const validData = {
    firstName: 'John',
    lastName: 'Smith',
    email: 'already@taken.com',
    password: 'passwordd',
  }

  const result = await createUserUseCase.execute(validData);

  expect(result.value.isFailure).toBe(true);
  expect(result.value.constructor.name).toBe('AccountAlreadyExists');
});

test('User creation fails when saving to DB fails', async () => {
  const validData = {
    firstName: 'PLEASE FAIL WHEN SAVING',
    lastName: 'Smith',
    email: 'js@gmail.com',
    password: 'passwordd',
  }

  const result = await createUserUseCase.execute(validData);

  expect(result.value.isFailure).toBe(true);
  expect(result.value.constructor.name).toBe('UnexpectedError');
});
