import { UniqueEntityID } from '../../../shared/domain/UniqueEntityID';
import { Result } from '../../../shared/core/Result';
import { Amount } from '../domain/Amount';
import { Transaction } from '../domain/Transaction';

export class TransactionMap {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static toPersistence(transaction: Transaction): any {
    const { balance, delta, date, description } = transaction.props;
    return {
      balance: balance.value,
      delta: delta.value,
      date,
      description,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static toDomain(raw: any): Transaction {
    const balanceOrError = Amount.create({value: raw.balance });
    const deltaOrError = Amount.create({ value: raw.delta });

    const dtoResult = Result.combine([
      balanceOrError,
      deltaOrError,
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
        description: raw.description,
      },
      new UniqueEntityID(raw.id)
    );
  }
}
