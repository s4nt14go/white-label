import { Amount } from '../Amount';
import { Description } from '../Description';
import Chance from 'chance';
import { TransactionCreatedEvent } from './TransactionCreatedEvent';
import { getRandom, seedAccount } from '../../../../shared/utils/test';

const chance = new Chance();

test('TransactionCreatedEvent is added to account during creation', () => {
  const account = seedAccount();

  const transaction = account.createTransaction(
    Amount.create({ value: getRandom({min: 0}) }).value,
    Description.create({ value: chance.sentence() }).value
  ).value;

  expect(account.domainEvents.length).toBe(1);
  const domainEvent = account.domainEvents[0] as TransactionCreatedEvent;
  expect(domainEvent.constructor.name).toBe('TransactionCreatedEvent');
  expect(account.id.toValue()).toBe(domainEvent.aggregateId);
  const txEvent = domainEvent.transaction;
  expect(transaction.id.toString()).toBe(txEvent.id);
  expect(transaction.description.value).toBe(txEvent.description);
  expect(transaction.date).toBe(txEvent.date);
  expect(transaction.balance.value).toBe(txEvent.balance);
  expect(transaction.delta.value).toBe(txEvent.delta);
});
