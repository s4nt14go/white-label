import { Transaction } from 'sequelize';

export declare class IRepo {
  public setTransaction(transaction: Transaction): void;
}
