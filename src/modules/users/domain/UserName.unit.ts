import { UserName } from './UserName';
import { CreateNameErrors } from './UserNameErrors';

test('Creation', () => {
  const validData = {
    name: 'test_name',
  };

  const result = UserName.create(validData);
  expect(result.isSuccess).toBe(true);
  const username = result.value;
  expect(username.value).toBe('test_name');
});

test('Creation fails without username', () => {
  const result = UserName.create({} as never);
  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(CreateNameErrors.NameNotDefined);
});

test('Creation fails with a non-string value', () => {
  const invalidData = {
    name: 1 as never,
  };

  const result = UserName.create(invalidData);
  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(CreateNameErrors.NameNotString);
});

test('Creation fails with a short username', () => {
  const invalidData = {
    name: '1',
  };

  const result = UserName.create(invalidData);
  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(CreateNameErrors.TooShort);
});

test('Creation fails with a long username', () => {
  const invalidData = {
    name: '1234567890123456',
  };

  const result = UserName.create(invalidData);
  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(CreateNameErrors.TooLong);
});

test('Creation fails with invalid characters', () => {
  const invalidData = {
    name: 'USer123$%^&{',
  };

  const result = UserName.create(invalidData);
  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(CreateNameErrors.InvalidCharacters);
  const msg = (result.error as CreateNameErrors.InvalidCharacters).message;
  expect('$%^&{'.split('').every((item) => msg.includes(item))).toBe(true);
});
