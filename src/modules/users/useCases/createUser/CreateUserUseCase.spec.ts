import { CreateUserUseCase } from './CreateUserUseCase';
import { UserRepoFake } from '../../repos/implementations/fake';
import '../../subscribers';

let userRepoFake, createUserUseCase;
beforeEach(() => {
  userRepoFake = new UserRepoFake();
  createUserUseCase = new CreateUserUseCase(userRepoFake);
})

test('User creation', async () => {

  const validData = {
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'pep@gmail.com',
    password: 'passworddd',
  }

  const result = await createUserUseCase.execute(validData);

  console.log('result', result);
  expect(result.value.isSuccess).toEqual(true);

});
