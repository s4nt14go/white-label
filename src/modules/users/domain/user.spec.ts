import { UniqueEntityID } from '../../../core/domain/UniqueEntityID';
import { createUser } from '../testUtils';
import { User } from './user';

test('Create user', () => {
    const userOrError = createUser({
        username: 'test_username',
        email: 'test_email',
        password: 'test_password',
    });

    expect(userOrError.isSuccess).toBe(true);
    const user = userOrError.getValue() as User;
    expect(user.id.constructor.name).toBe('UniqueEntityID');
    expect(user.username.value).toBe('test_username');
    expect(user.email.value).toBe('test_email');
    expect(user.password.value).toBe('test_password');

    expect(user.domainEvents.length).toBe(1);
    const domainEvent = user.domainEvents[0];
    expect(domainEvent.constructor.name).toBe('UserCreatedEvent');
    expect(user.id).toBe(domainEvent.getAggregateId());
});

test('Create user with id', () => {
    const id = new UniqueEntityID();

    const userOrError = createUser({ id });

    expect(userOrError.isSuccess).toBe(true);
    const user = userOrError.getValue() as User;
    expect(user.id).toBe(id);
});

test.each(['username', 'email', 'password'])('Fails with %p null', (field) => {
    const invalidData: any = {
        username: 'test_username',
        email: 'test_email',
        password: 'test_password',
    }
    delete invalidData[field];

    const userOrError = User.create(invalidData);

    expect(userOrError.isFailure).toBe(true);
    expect(userOrError.error).toContain(field);
});