import { EntityID } from '../../../shared/domain/EntityID';
import { createUser } from '../../../shared/utils/test';

test('Create user with alias', () => {
  const user = createUser({
    username: 'test_username',
    email: 'test+1@email.com',
    alias: 'test_alias',
    password: 'test_password',
  });

  expect(user.username.value).toBe('test_username');
  expect(user.alias.value).toBe('test_alias');
  expect(user.email.value).toBe('test+1@email.com');
  expect(user.password.value).toBe('test_password');
});

test('Create user without alias', () => {
  const user = createUser({
    username: 'test_username',
    email: 'test@email.com',
    password: 'test_password',
  });

  expect(user.username.value).toBe('test_username');
  expect(user.alias.value).toBe(null);
  expect(user.email.value).toBe('test@email.com');
  expect(user.password.value).toBe('test_password');
});

test('Create user with id', () => {
  const id = new EntityID();

  const user = createUser({ id });

  expect(user.id).toBe(id);
});
