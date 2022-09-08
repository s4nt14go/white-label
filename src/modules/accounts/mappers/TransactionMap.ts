import { UniqueEntityID } from '../../../shared/domain/UniqueEntityID';
import { Result } from '../../../shared/core/Result';
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
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static toDomain(raw: any): Transaction {
    const balanceOrError = Amount.create({value: raw.balance });
    const deltaOrError = Amount.create({ value: raw.delta });
    const descriptionOrError = Description.create({ value: raw.description });

    const dtoResult = Result.combine([
      balanceOrError,
      deltaOrError,
      descriptionOrError,
    ]);

    if (dtoResult.isFailure) {
      console.log('raw:', raw);
      console.log('dtoResult:', dtoResult);
      throw Error(`Transaction couldn't be reconstructed from raw data: ${dtoResult.error.type}`);
    }

    return Transaction.create(
      {
        balance: balanceOrError.value,
        delta: deltaOrError.value,
        date: raw.date,
        description: descriptionOrError.value,
      },
      new UniqueEntityID(raw.id)
    );
  }
}
