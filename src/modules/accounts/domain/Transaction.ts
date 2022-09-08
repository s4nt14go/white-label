import { Amount } from './Amount';
import { UniqueEntityID } from '../../../shared/domain/UniqueEntityID';
import { AggregateRoot } from '../../../shared/domain/AggregateRoot';

interface TransactionProps {
  balance: Amount;
  delta: Amount;
  date: Date;
  description: string;
}

export class Transaction extends AggregateRoot<TransactionProps> {
  static Initial(): Transaction {
    return this.create({
      description: 'Initial',
      balance: Amount.create({value: 0}).value,
      delta: Amount.create({value: 0}).value,
      date: new Date(),
    });
}

  get id(): UniqueEntityID {
    return this._id;
  }
  get balance(): Amount {
    return this.props.balance;
  }
  get delta(): Amount {
    return this.props.delta;
  }
  get date(): Date {
    return this.props.date;
  }
  get description(): string {
    return this.props.description;
  }

  private constructor(props: TransactionProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(props: TransactionProps, id?: UniqueEntityID): Transaction {
    if (props.balance.value < 0) throw Error(`Balance can't be negative but this transaction has ${props.balance.value}`);
    return new Transaction(props, id);
  }
}