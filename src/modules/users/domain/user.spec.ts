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
    expect(userOrError.getValue().id.equals(domainEvent.getAggregateId())).toBe(true);
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
    expect(userOrError.getValue().id.equals(id)).toBe(true);
    expect(userOrError.getValue().username).toBe('testUsername');
});

test('Fails with firstName null', () => {
    const userOrError = createUser({ firstName: null });

    expect(userOrError.isFailure).toBe(true);
    expect(userOrError.error).toBe(`firstName is null or undefined`);
});