import { expect, test } from 'vitest';
import { UniqueEntityID } from '../../../core/domain/UniqueEntityID';
import { createUser } from '../utils/testUtils';

test('Create user', () => {
    const user = createUser({
        username: 'test_username',
        email: 'test@email.com',
        password: 'test_password',
    });

    expect(user.id.constructor.name).toBe('UniqueEntityID');
    expect(user.username.value).toBe('test_username');
    expect(user.email.value).toBe('test@email.com');
    expect(user.password.value).toBe('test_password');
});

test('Create user with id', () => {
    const id = new UniqueEntityID();

    const user = createUser({ id });

    expect(user.id).toBe(id);
});