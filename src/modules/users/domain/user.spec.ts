import { UniqueEntityID } from '../../../core/domain/UniqueEntityID';
import { createUser } from '../testUtils';

test('Create user without username', () => {
    const userOrError = createUser({});

    expect(userOrError.isSuccess).toBe(true);
    expect(userOrError.getValue().id.constructor.name).toBe('UniqueEntityID');
    expect(userOrError.getValue().username).toBe('');

    expect(userOrError.getValue().domainEvents.length).toBe(1);
    const domainEvent = userOrError.getValue().domainEvents[0];
    expect(domainEvent.constructor.name).toBe('UserCreatedEvent');
    expect(userOrError.getValue().id).toBe(domainEvent.getAggregateId());
});

test('Create user with username', () => {
    const userOrError = createUser({ username: 'testUsername' });

    expect(userOrError.isSuccess).toBe(true);
    expect(userOrError.getValue().username).toBe('testUsername');
});

test('Create user with id', () => {
    const id = new UniqueEntityID();
    const userOrError = createUser({ username: 'testUsername', id });

    expect(userOrError.isSuccess).toBe(true);
    expect(userOrError.getValue().id).toBe(id);
    expect(userOrError.getValue().username).toBe('testUsername');
});

test.each(['firstName', 'lastName', 'email', 'isEmailVerified'])('Fails with %p null', (field) => {
    console.log('field', field);
    const userOrError = createUser({ [field]: null });

    expect(userOrError.isFailure).toBe(true);
    expect(userOrError.error).toContain(field);
});