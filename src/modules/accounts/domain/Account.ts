import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { UniqueEntityID } from '../../../shared/domain/UniqueEntityID';
import { Amount } from './Amount';
import { Transaction } from './Transaction';

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
    })
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

  public static create(props: AccountInput, id?: UniqueEntityID): Account {
    const transactionsLength = props.transactions.length;
    if ( transactionsLength < 1) throw Error(`Accounts should have at least one transaction but this has ${transactionsLength}`);
    return new Account({
      ...props,
      balance: props.transactions[0].balance,
    }, id);
  }
}
