import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { UniqueEntityID } from '../../../shared/domain/UniqueEntityID';
import { Amount } from './Amount';
import { Transaction } from './Transaction';
import { Result } from '../../../shared/core/Result';
import { AccountErrors } from './AccountErrors';

interface AccountProps {
  balance: Amount;
  active: boolean;
  transactions: Transaction[];
}

interface AccountInput {
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
  get id(): UniqueEntityID {
    return this._id;
  }
  get balance(): Amount {
    return this.props.balance;
  }
  get active(): boolean {
    return this.props.active;
  }
  get transactions(): Transaction[] {
    return this.props.transactions;
  }

  private constructor(props: AccountProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: AccountInput, id?: UniqueEntityID): Result<Account> {
    const transactionsLength = props.transactions.length;
    if ( transactionsLength < 1)
      return Result.fail(new AccountErrors.NoTransactions());

    return Result.ok(new Account({
      ...props,
      balance: props.transactions[0].balance,
    }, id));
  }
}
