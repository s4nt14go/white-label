import { Alias } from './alias';
import { AliasErrors } from './aliasErrors';

test('Creation', () => {
  const validData = {
    value: 'test_alias',
  };

  const result = Alias.create(validData);
  expect(result.isSuccess).toBe(true);
  const alias = result.value as Alias;
  expect(alias.value).toBe('test_alias');
});

test(`Creation is successful and gives null when it's not defined`, () => {
  const result = Alias.create({} as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  expect(result.isSuccess).toBe(true);
  const alias = result.value as Alias;
  expect(alias.value).toBe(null);
});

test('Creation fails with a non-string value', () => {
  const invalidData = {
    value: 1 as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  };

  const result = Alias.create(invalidData);
  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(AliasErrors.AliasNotString);
});

test('Creation fails with a short value', () => {
  const invalidData = {
    value: '1',
  };

  const result = Alias.create(invalidData);
  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(AliasErrors.TooShort);
});

test('Creation fails with a long value', () => {
  const invalidData = {
    value: '1234567890123456',
  };

  const result = Alias.create(invalidData);
  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(AliasErrors.TooLong);
});

test('Creation fails with invalid characters', () => {
  const invalidData = {
    value: 'Alias123$%^&{',
  };

  const result = Alias.create(invalidData);
  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(AliasErrors.InvalidCharacters);
  const msg = (result.error as AliasErrors.InvalidCharacters).message;
  expect('$%^&{'.split('').every((item) => msg.includes(item))).toBe(true);
});
