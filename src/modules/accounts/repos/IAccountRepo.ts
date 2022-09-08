import { Account } from '../domain/Account';
import { IRepo } from '../../../shared/core/IRepo';
import { Transaction } from 'sequelize';

export declare class IAccountRepo implements IRepo {
  public setTransaction(transaction?: Transaction): void;
  public create(userId: string, newAccount: Account): void;
}
