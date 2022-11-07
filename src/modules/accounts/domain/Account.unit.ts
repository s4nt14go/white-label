import { Transaction } from './Transaction';
import { Amount } from './Amount';
import { Description } from './Description';
import { Account } from './Account';
import { AccountErrors } from './AccountErrors';
import Chance from 'chance';
import { BaseError } from '../../../shared/core/AppError';
import { seedAccount } from '../../../shared/utils/test';

const chance = new Chance();

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
  expect(account.balance().value).toBe(200);
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

describe('createTransaction', () => {
  test('creation', () => {
    const account = seedAccount();

    const quantity = 30;
    const delta = Amount.create({ value: quantity }).value;
    const text = `Test: ${chance.sentence()}`;
    const description = Description.create({ value: text }).value;
    const transactionOrError = account.createTransaction(delta, description);

    expect(transactionOrError.isSuccess).toBe(true);
    const transactionCreated = transactionOrError.value;
    expect(transactionCreated.balance.value).toBe(200 + quantity);
    expect(transactionCreated.description.value).toBe(text);
    expect(transactionCreated.delta.value).toBe(quantity);
    expect(transactionCreated.date).toBeInstanceOf(Date);
  });

  it('fails for negative balance', () => {
    const account = seedAccount();

    const quantity = -201;
    const delta = Amount.create({ value: quantity }).value;
    const text = `Test: debit greater than balance`;
    const description = Description.create({ value: text }).value;
    const transactionOrError = account.createTransaction(delta, description);
    const error = transactionOrError.error;

    expect(transactionOrError.isFailure).toBe(true);
    if (!(error instanceof BaseError))
      throw Error(`Transaction didn't error when should`);
    expect(error.type).toBe('AccountErrors.InvalidTransaction');
  });

  it('fails for inactive accounts', () => {
    const account = seedAccount(false);

    const delta = Amount.create({ value: 1 }).value;
    const description = Description.create({
      value: `Test: ${chance.sentence()}`,
    }).value;
    const transactionOrError = account.createTransaction(delta, description);
    const error = transactionOrError.error;

    expect(transactionOrError.isFailure).toBe(true);
    if (!(error instanceof BaseError))
      throw Error(`Transaction didn't error when should`);
    expect(error.type).toBe('AccountErrors.NotActive');
  });
});
