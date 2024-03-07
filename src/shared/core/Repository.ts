import { AggregateRoot } from '../domain/AggregateRoot';
import { Transaction } from 'sequelize';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export abstract class Repository<T extends AggregateRoot<unknown>> {
  // Put this.transaction in all repos queries, e.g.:
  // this.<Model>.create({...}, { transaction: this.transaction })
  // this.<Model>.findAll/findOne/destroy({ where: ..., transaction: this.transaction })
  // this.<Model>.findByPk(pk, { transaction: this.transaction })
  // this.transaction is SequelizeTransaction and is populated when Transaction decorator is used, if that decorator isn't used, this.transaction is null and doesn't have any effect (SQL transaction isn't used)
  protected transaction?: Transaction;
  public setTransaction(transaction: Transaction) {
    this.transaction = transaction;
  }
}
