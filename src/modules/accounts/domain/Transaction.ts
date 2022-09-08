import { Amount } from './Amount';
import { UniqueEntityID } from '../../../shared/domain/UniqueEntityID';
import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { Description } from './Description';

interface TransactionProps {
  balance: Amount;
  delta: Amount;
  date: Date;
  description: Description;
}

export class Transaction extends AggregateRoot<TransactionProps> {
  public static Initial(): Transaction {
    return this.create({
      description: Description.create({ value: 'Initial' }).value,
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
  get description(): Description {
    return this.props.description;
  }

  private constructor(props: TransactionProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: TransactionProps, id?: UniqueEntityID): Transaction {
    if (props.balance.value < 0) throw Error(`Balance can't be negative but this transaction has ${props.balance.value}`);
    return new Transaction(props, id);
  }
}