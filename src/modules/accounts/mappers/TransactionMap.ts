import { EntityID } from '../../../shared/domain/EntityID';
import { Amount } from '../domain/Amount';
import { Transaction } from '../domain/Transaction';
import { Description } from '../domain/Description';

export class TransactionMap {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static toPersistence(transaction: Transaction): any {
    const { balance, delta, date, description } = transaction.props;
    return {
      balance: balance.value,
      delta: delta.value,
      date,
      description: description.value,
      id: transaction.id.toString(),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static toDomain(raw: any): Transaction {
    return Transaction.create(
      {
        balance: Amount.create({ value: raw.balance }).value,
        delta: Amount.create({ value: raw.delta }).value,
        date: raw.date,
        description: Description.create({ value: raw.description }).value,
      },
      new EntityID(raw.id)
    ).value;
  }
}
