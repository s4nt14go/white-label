import { Transaction } from './Transaction';
import { Amount } from './Amount';
import { Description } from './Description';
import { TransactionErrors } from './TransactionErrors';

test('Create transaction', () => {
  const date = new Date();
  const result = Transaction.create({
    balance: Amount.create({ value: 100 }).value,
    delta: Amount.create({ value: -100 }).value,
    date,
    description: Description.create({ value: 'Test transaction' }).value,
  });

  expect(result.isSuccess).toBe(true);
  const transaction = result.value;
  expect(transaction.balance.value).toBe(100);
  expect(transaction.delta.value).toBe(-100);
  expect(transaction.date).toBe(date);
  expect(transaction.description.value).toBe('Test transaction');
});

test('initial transaction has 0 balance', () => {
  const transaction = Transaction.Initial();

  expect(transaction.balance.value).toBe(0);
  expect(transaction.delta.value).toBe(0);
});

it('fails with negative balance', () => {
  const date = new Date();
  const result = Transaction.create({
    balance: Amount.create({ value: -1 }).value,
    delta: Amount.create({ value: -100 }).value,
    date,
    description: Description.create({ value: 'Test transaction' }).value,
  });

  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(TransactionErrors.NegativeBalance);
});
