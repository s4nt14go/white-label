import { Transaction } from './Transaction';
import { Amount } from './Amount';
import { Description } from './Description';
import { Account } from './Account';
import { AccountErrors } from './AccountErrors';

test('Create account', () => {
  const transaction = Transaction.create({
    balance: Amount.create({ value: 200 }).value,
    delta: Amount.create({ value: 100 }).value,
    date: new Date(),
    description: Description.create({ value: 'First transaction' }).value,
  }).value;
  const active = Math.random() > 0.5;
  const result = Account.create({
    active,
    transactions: [transaction],
  });

  expect(result.isSuccess).toBe(true);
  const account = result.value;
  expect(account.active).toBe(active);
  expect(account.balance.value).toBe(200);
  expect(account.transactions[0].balance.value).toBe(200);
  expect(account.transactions[0].delta.value).toBe(100);
});

it(`fails if there aren't any transactions`, () => {
  const result = Account.create({
    active: true,
    transactions: [],
  });

  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(AccountErrors.NoTransactions);
});