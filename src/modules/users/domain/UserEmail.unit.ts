import { UserEmail } from './UserEmail';
import { CreateEmailErrors } from './UserEmailErrors';

test('Creation', () => {
  const result = UserEmail.create('some@email.com');

  expect(result.isSuccess).toBe(true);
  const userEmail = result.value;
  expect(userEmail.value).toBe('some@email.com');
});

test('Fails with invalid email', () => {
  const result = UserEmail.create('john@gmail.b');

  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(CreateEmailErrors.EmailNotValid);
});
