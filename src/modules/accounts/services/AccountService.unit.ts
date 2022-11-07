import { Transaction } from '../domain/Transaction';
import { Amount } from '../domain/Amount';
import { Description } from '../domain/Description';
import { Account } from '../domain/Account';
import Chance from 'chance';
import { BaseError } from '../../../shared/core/AppError';
import { AccountService } from './AccountService';

const chance = new Chance();
const accountService = new AccountService();

describe('transferTo', () => {
  test('creation', () => {
    // Create accounts
    const seedFromAccount = Transaction.create({
      balance: Amount.create({ value: 200 }).value,
      delta: Amount.create({ value: 100 }).value,
      date: new Date(),
      description: Description.create({ value: 'Test: Seed transaction' }).value,
    }).value;
    const fromAccount = Account.create({
      active: true,
      transactions: [seedFromAccount],
    }).value;
    const toAccount = Account.Initial();

    const quantity = 30;
    const delta = Amount.create({ value: quantity }).value;
    const fromText = `Test: ${chance.sentence()}`;
    const fromDescription = Description.create({ value: fromText }).value;
    const toText = `Test: ${chance.sentence()}`;
    const toDescription = Description.create({ value: toText }).value;
    const txsOrError = accountService.transfer({
      fromAccount,
      toAccount,
      delta,
      fromDescription,
      toDescription,
    });
    const { fromTransaction, toTransaction } = txsOrError.value;

    expect(txsOrError.isSuccess).toBe(true);
    expect(fromTransaction.balance.value).toBe(200 - quantity);
    expect(fromTransaction.description.value).toBe(fromText);
    expect(fromTransaction.delta.value).toBe(-quantity);
    expect(fromTransaction.date).toBeInstanceOf(Date);
    expect(toTransaction.balance.value).toBe(quantity);
    expect(toTransaction.description.value).toBe(toText);
    expect(toTransaction.delta.value).toBe(quantity);
    expect(toTransaction.date).toBeInstanceOf(Date);
  });

  it('fails for negative balance in source/from account', () => {
    // Create accounts
    const seedFromAccount = Transaction.create({
      balance: Amount.create({ value: 200 }).value,
      delta: Amount.create({ value: 100 }).value,
      date: new Date(),
      description: Description.create({ value: 'Test: Seed transaction' }).value,
    }).value;
    const fromAccount = Account.create({
      active: true,
      transactions: [seedFromAccount],
    }).value;
    const toAccount = Account.Initial();

    const quantity = 201;
    const delta = Amount.create({ value: quantity }).value;
    const fromDescription = Description.create({ value: 'Test' }).value;
    const txsOrError = accountService.transfer({
      fromAccount,
      toAccount,
      delta,
      fromDescription,
      toDescription: fromDescription,
    });
    const { error } = txsOrError;

    expect(txsOrError.isFailure).toBe(true);
    if (!(error instanceof BaseError))
      throw Error(`Transaction didn't error when should`);
    expect(error.type).toBe('AccountServiceErrors.InvalidFromTransaction');
  });

  it('fails for negative balance in destination/to account', () => {
    // Create accounts
    const seedFromAccount = Transaction.create({
      balance: Amount.create({ value: 200 }).value,
      delta: Amount.create({ value: 100 }).value,
      date: new Date(),
      description: Description.create({ value: 'Test: Seed transaction' }).value,
    }).value;
    const fromAccount = Account.create({
      active: true,
      transactions: [seedFromAccount],
    }).value;
    const toAccount = Account.Initial();

    const quantity = -1;
    const delta = Amount.create({ value: quantity }).value;
    const fromDescription = Description.create({ value: 'Test' }).value;
    const txsOrError = accountService.transfer({
      fromAccount,
      toAccount,
      delta,
      fromDescription,
      toDescription: fromDescription,
    });
    const { error } = txsOrError;

    expect(txsOrError.isFailure).toBe(true);
    if (!(error instanceof BaseError))
      throw Error(`Transaction didn't error when should`);
    expect(error.type).toBe('AccountServiceErrors.InvalidToTransaction');
  });

  it('fails for inactive source/from account', () => {
    // Create accounts
    const seedFromAccount = Transaction.create({
      balance: Amount.create({ value: 200 }).value,
      delta: Amount.create({ value: 100 }).value,
      date: new Date(),
      description: Description.create({ value: 'Test: Seed transaction' }).value,
    }).value;
    const fromAccount = Account.create({
      active: false,
      transactions: [seedFromAccount],
    }).value;
    const toAccount = Account.Initial();

    const delta = Amount.create({ value: 1 }).value;
    const fromDescription = Description.create({ value: 'Test' }).value;
    const txsOrError = accountService.transfer({
      fromAccount,
      toAccount,
      delta,
      fromDescription,
      toDescription: fromDescription,
    });
    const { error } = txsOrError;

    expect(txsOrError.isFailure).toBe(true);
    if (!(error instanceof BaseError))
      throw Error(`Transaction didn't error when should`);
    expect(error.type).toBe('AccountServiceErrors.FromAccountNotActive');
  });

  it('fails for inactive destination/to account', () => {
    // Create accounts
    const seedFromAccount = Transaction.create({
      balance: Amount.create({ value: 200 }).value,
      delta: Amount.create({ value: 100 }).value,
      date: new Date(),
      description: Description.create({ value: 'Test: Seed transaction' }).value,
    }).value;
    const fromAccount = Account.create({
      active: true,
      transactions: [seedFromAccount],
    }).value;
    const toAccount = Account.create({
      active: false,
      transactions: [seedFromAccount],
    }).value;

    const delta = Amount.create({ value: 1 }).value;
    const fromDescription = Description.create({ value: 'Test' }).value;
    const txsOrError = accountService.transfer({
      fromAccount,
      toAccount,
      delta,
      fromDescription,
      toDescription: fromDescription,
    });
    const { error } = txsOrError;

    expect(txsOrError.isFailure).toBe(true);
    if (!(error instanceof BaseError))
      throw Error(`Transaction didn't error when should`);
    expect(error.type).toBe('AccountServiceErrors.ToAccountNotActive');
  });

  it('fails when max is breached', () => {
    const balanceToTransfer = Amount.create({ value: Amount.MAX_ABS }).value;
    // Create accounts
    const seedFromAccount = Transaction.create({
      balance: balanceToTransfer,
      delta: Amount.create({ value: 100 }).value,
      date: new Date(),
      description: Description.create({ value: 'Test: Seed transaction' }).value,
    }).value;
    const fromAccount = Account.create({
      active: true,
      transactions: [seedFromAccount],
    }).value;
    const toAccount = Account.Initial();
    toAccount.createTransaction(
      Amount.create({ value: 1 }).value,
      Description.create({ value: 'Test' }).value
    );

    const fromDescription = Description.create({ value: 'Test' }).value;
    const txsOrError = accountService.transfer({
      fromAccount,
      toAccount,
      delta: balanceToTransfer,
      fromDescription,
      toDescription: fromDescription,
    });
    const { error } = txsOrError;

    expect(txsOrError.isFailure).toBe(true);
    if (!(error instanceof BaseError))
      throw Error(`Transfer didn't error when should`);
    expect(error.type).toBe('AccountServiceErrors.InvalidTransfer');
    expect(error.message).toContain('AmountErrors.MaxBreached');
  });
});
