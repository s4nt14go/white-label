import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { EntityID } from '../../../shared/domain/EntityID';
import { Amount } from './Amount';
import { Result } from '../../../shared/core/Result';
import { AccountErrors } from './AccountErrors';
import { Description } from './Description';
import { BaseError } from '../../../shared/core/AppError';
// Transaction Entity is internal, no other class different from Account should use/import it
import { Transaction, TransactionProps } from './Transaction';
import { TransactionCreatedEvent } from './events/TransactionCreatedEvent';

interface AccountProps {
  active: boolean;
  transactions: Transaction[];
}

export class Account extends AggregateRoot<AccountProps> {
  public static Initial(): Account {
    const initialTransaction = Transaction.Initial();
    return Account.create({
      active: true,
      transactions: [initialTransaction],
    }).value;
  }
  get id(): EntityID {
    return this._id;
  }
  public balance(): Amount {
    return this.props.transactions[0].balance;
  }
  get active(): boolean {
    return this.props.active;
  }
  get transactions(): Transaction[] {
    return this.props.transactions;
  }

  private constructor(props: AccountProps, id?: EntityID) {
    super(props, id);
  }

  public static create(props: AccountProps, id?: EntityID): Result<Account> {
    const transactionsLength = props.transactions.length;
    if (transactionsLength < 1)
      return Result.fail(new AccountErrors.NoTransactions());

    return Result.ok(
      new Account(
        {
          ...props,
        },
        id
      )
    );
  }

  private _createTransaction(
    props: TransactionProps,
    errorClass: typeof AccountErrors.InvalidTransaction
  ): Result<Transaction> {
    const transactionOrError = Transaction.create(props);
    if (transactionOrError.isFailure)
      return Result.fail(new errorClass(transactionOrError.error as BaseError));
    const transaction = transactionOrError.value;
    this.addDomainEvent(
      new TransactionCreatedEvent(this.id.toString(), transaction)
    );
    this.transactions.unshift(transaction);
    return Result.ok(transaction);
  }

  public createTransaction(
    delta: Amount,
    description: Description
  ): Result<Transaction> {
    if (!this.active) return Result.fail(new AccountErrors.NotActive());

    const balanceOrError = this.balance().add(delta);
    if (balanceOrError.isFailure)
      return Result.fail(
        new AccountErrors.InvalidTransaction(balanceOrError.error as BaseError)
      );

    return this._createTransaction(
      {
        balance: balanceOrError.value,
        delta,
        description,
        date: new Date(),
      },
      AccountErrors.InvalidTransaction
    );
  }

  public transferTo(
    toAccount: Account,
    delta: Amount,
    fromDescription: Description,
    toDescription: Description
  ): Result<{ fromTransaction: Transaction; toTransaction: Transaction }> {
    if (!this.active) return Result.fail(new AccountErrors.NotActive());
    if (!toAccount.active)
      return Result.fail(new AccountErrors.ToAccountNotActive());

    let balanceOrError = this.balance().subtract(delta);
    if (balanceOrError.isFailure)
      return Result.fail(
        new AccountErrors.InvalidTransfer(balanceOrError.error as BaseError)
      );

    const date = new Date();
    const fromTransactionOrError = this._createTransaction(
      {
        balance: balanceOrError.value,
        delta: delta.negate(),
        description: fromDescription,
        date,
      },
      AccountErrors.InvalidFromTransaction
    );
    if (fromTransactionOrError.isFailure)
      return Result.fail(fromTransactionOrError.error as BaseError);

    const fromTransaction = fromTransactionOrError.value;

    balanceOrError = toAccount.balance().add(delta);
    if (balanceOrError.isFailure)
      return Result.fail(
        new AccountErrors.InvalidTransfer(balanceOrError.error as BaseError)
      );

    const toTransactionOrError = this._createTransaction(
      {
        balance: balanceOrError.value,
        delta,
        description: toDescription,
        date,
      },
      AccountErrors.InvalidToTransaction
    );
    if (toTransactionOrError.isFailure)
      return Result.fail(toTransactionOrError.error as BaseError);

    const toTransaction = toTransactionOrError.value;

    return Result.ok({
      fromTransaction,
      toTransaction,
    });
  }
}
