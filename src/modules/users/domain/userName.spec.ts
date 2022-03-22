
import { UserName } from "./userName";

test('Creation', () => {
  const validData = {
    name: 'test_name',
  };

  const result = UserName.create(validData);
  expect(result.isSuccess).toBe(true);
  const username = result.getValue() as UserName;
  expect(username.value).toBe('test_name');
});

test('Creation fails without username', () => {
  const invalidData = {
  } as any;

  const result = UserName.create(invalidData);
  expect(result.isFailure).toBe(true);
  expect(result.error).toContain('username');
});

test('Creation fails with a short username', () => {
  const invalidData = {
    name: '1',
  };

  const result = UserName.create(invalidData);
  expect(result.isFailure).toBe(true);
  expect(result.error).toContain('at least');
});

test('Creation fails with a long username', () => {
  const invalidData = {
    name: '1234567890123456',
  };

  const result = UserName.create(invalidData);
  expect(result.isFailure).toBe(true);
  expect(result.error).toContain('greater');
});