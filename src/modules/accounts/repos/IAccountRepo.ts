import { Account } from '../domain/Account';
import { IRepo } from '../../../shared/core/IRepo';
import { Transaction } from 'sequelize';

export declare class IAccountRepo implements IRepo {
  setTransaction(transaction?: Transaction): void;
  create(userId: string, newAccount: Account): void;
}
