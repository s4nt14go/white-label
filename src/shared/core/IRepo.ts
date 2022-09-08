import { Transaction } from 'sequelize';

export declare class IRepo {
  setTransaction(transaction: Transaction): void;
}
