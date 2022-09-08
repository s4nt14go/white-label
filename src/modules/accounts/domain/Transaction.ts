import { Amount } from './Amount';
import { UniqueEntityID } from '../../../shared/domain/UniqueEntityID';
import { Description } from './Description';
import { Entity } from '../../../shared/domain/Entity';
import { Result } from '../../../shared/core/Result';
import { TransactionErrors } from './TransactionErrors';

interface TransactionProps {
  balance: Amount;
  delta: Amount;
  date: Date;
  description: Description;
}

export class Transaction extends Entity<TransactionProps> {
  public static Initial(): Transaction {
    return this.create({
      description: Description.create({ value: 'Initial' }).value,
      balance: Amount.create({value: 0}).value,
      delta: Amount.create({value: 0}).value,
      date: new Date(),
    }).value;
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

  public static create(props: TransactionProps, id?: UniqueEntityID): Result<Transaction> {
    if (props.balance.value < 0)
      return Result.fail(new TransactionErrors.NegativeBalance(props.balance.value))

    return Result.ok(new Transaction(props, id));
  }
}