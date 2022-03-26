import { createUser } from '../../utils/testUtils';
import { User } from '../user';

test('UserCreatedEvent is added to user during creation', () => {
    const user = createUser({}).getValue() as User;

    expect(user.domainEvents.length).toBe(1);
    const domainEvent = user.domainEvents[0];
    expect(domainEvent.constructor.name).toBe('UserCreatedEvent');
    expect(user.id).toBe(domainEvent.getAggregateId());
});