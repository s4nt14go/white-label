import { AggregateRoot } from '../domain/AggregateRoot';
import { Transaction } from 'sequelize';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export abstract class Repository<T extends AggregateRoot<unknown>> {
  protected transaction?: Transaction;
  public setTransaction(transaction: Transaction) {
    this.transaction = transaction;
  }
}
