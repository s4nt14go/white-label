import { createUser } from '../../../../shared/utils/test';

test('UserCreatedEvent is added to user during creation', () => {
  const user = createUser({});

  expect(user.domainEvents.length).toBe(1);
  const domainEvent = user.domainEvents[0];
  expect(domainEvent.constructor.name).toBe('UserCreatedEvent');
  expect(user.id.toValue()).toBe(domainEvent.aggregateId);
});
