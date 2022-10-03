import { UserPassword } from './UserPassword';
import { CreatePasswordErrors } from './UserPasswordErrors';

test('Create with plain text', async () => {
  const passwordOrError = UserPassword.create({ value: 'super_secret' });

  expect(passwordOrError.isSuccess).toBe(true);
  const password = passwordOrError.value;
  expect(password.value).toBe('super_secret');

  const passwordValid = await password.comparePassword('super_secret');
  expect(passwordValid).toBe(true);
  expect(password.isAlreadyHashed()).toBe(false);
});

test('Fails with undefined', async () => {
  const passwordOrError = UserPassword.create({
    value: undefined as unknown as string,
  });

  expect(passwordOrError.isFailure).toBe(true);
  expect(passwordOrError.error).toBeInstanceOf(
    CreatePasswordErrors.PasswordNotDefined
  );
});

test('Fails with a type different from string', async () => {
  const passwordOrError = UserPassword.create({ value: 1 as never });

  expect(passwordOrError.isFailure).toBe(true);
  expect(passwordOrError.error).toBeInstanceOf(
    CreatePasswordErrors.PasswordNotString
  );
});

test(`Fails when it's too short`, async () => {
  const passwordOrError = UserPassword.create({ value: 'short' });

  expect(passwordOrError.isFailure).toBe(true);
  expect(passwordOrError.error).toBeInstanceOf(CreatePasswordErrors.TooShort);
});

test('Create with hashed text', async () => {
  // Hash for password 'super_secret' with salt bcrypt.hashSync("bacon"): $2a$10$QMdHMmcWVZGrYxIPyHeMfOynZyb9Go8yjvdJLNU8AQ5M0YhLRJLIO
  const hash = '$2a$10$QMdHMmcWVZGrYxIPyHeMfOynZyb9Go8yjvdJLNU8AQ5M0YhLRJLIO';
  const passwordOrError = UserPassword.create({ value: hash, hashed: true });

  expect(passwordOrError.isSuccess).toBe(true);
  const password = passwordOrError.value;
  const passwordValid = await password.comparePassword('super_secret');
  expect(passwordValid).toBe(true);
  expect(password.isAlreadyHashed()).toBe(true);
  const hashGotten = await password.getHashedValue();
  expect(hashGotten).toBe(hash);
});
