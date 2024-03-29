import { Alias } from './Alias';
import { AliasErrors } from './AliasErrors';

test(`Creation using a string`, () => {
  const validData = {
    value: 'test_alias',
  };

  const result = Alias.create(validData);
  expect(result.isSuccess).toBe(true);
  const alias = result.value;
  expect(alias.value).toBe('test_alias');
});

test(`Creation using null`, () => {
  const validData = {
    value: null,
  };

  const result = Alias.create(validData);
  expect(result.isSuccess).toBe(true);
  const alias = result.value;
  expect(alias.value).toBe(null);
});

test(`Creation fails with a short value`, () => {
  const invalidData = {
    value: '1',
  };

  const result = Alias.create(invalidData);
  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(AliasErrors.TooShort);
});

test(`Creation fails with a long value`, () => {
  const invalidData = {
    value: '1234567890123456',
  };

  const result = Alias.create(invalidData);
  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(AliasErrors.TooLong);
});

test(`Creation fails with invalid characters`, () => {
  const invalidData = {
    value: 'Alias123$%^&{',
  };

  const result = Alias.create(invalidData);
  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(AliasErrors.InvalidCharacters);
  const msg = (result.error as AliasErrors.InvalidCharacters).message;
  expect('$%^&{'.split('').every((item) => msg.includes(item))).toBe(true);
});
