import { Account } from '../domain/Account';
import { Amount } from '../domain/Amount';
import { Description } from '../domain/Description';
import { Result } from '../../../shared/core/Result';
import { Transaction } from '../domain/Transaction';
import { BaseError } from '../../../shared/core/AppError';
import { AccountServiceErrors } from './AccountServiceErrors';

export class AccountService {
  public transfer({
    delta,
    fromAccount,
    fromDescription,
    toAccount,
    toDescription,
  }: {
    delta: Amount;
    fromAccount: Account;
    fromDescription: Description;
    toAccount: Account;
    toDescription: Description;
  }): Result<{ fromTransaction: Transaction; toTransaction: Transaction }> {
    if (!fromAccount.active) return Result.fail(new AccountServiceErrors.FromAccountNotActive());
    if (!toAccount.active)
      return Result.fail(new AccountServiceErrors.ToAccountNotActive());

    let balanceOrError = fromAccount.balance().subtract(delta);
    if (balanceOrError.isFailure)
      return Result.fail(
        new AccountServiceErrors.InvalidTransfer(balanceOrError.error as BaseError)
      );

    const fromTransactionOrError = fromAccount.createTransaction(
      delta.negate(),
      fromDescription
    );
    if (fromTransactionOrError.isFailure)
      return Result.fail(new AccountServiceErrors.InvalidFromTransaction(fromTransactionOrError.error as BaseError));

    const fromTransaction = fromTransactionOrError.value;

    balanceOrError = toAccount.balance().add(delta);
    if (balanceOrError.isFailure)
      return Result.fail(
        new AccountServiceErrors.InvalidTransfer(balanceOrError.error as BaseError)
      );

    const toTransactionOrError = toAccount.createTransaction(delta, toDescription);
    if (toTransactionOrError.isFailure)
      return Result.fail(new AccountServiceErrors.InvalidToTransaction(toTransactionOrError.error as BaseError));

    const toTransaction = toTransactionOrError.value;

    return Result.ok({
      fromTransaction,
      toTransaction,
    });
  }
}
