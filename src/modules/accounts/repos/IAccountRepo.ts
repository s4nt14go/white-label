import { Account } from '../domain/Account';
import { IRepo } from '../../../shared/core/IRepo';
import { Transaction as SequelizeTransaction } from 'sequelize';
import { Transaction } from '../domain/Transaction';

export interface TransferProps {
  from: {
    transaction: Transaction;
    accountId: string;
  };
  to: {
    transaction: Transaction;
    accountId: string;
  };
}

export declare class IAccountRepo implements IRepo {
  public setTransaction(transaction?: SequelizeTransaction): void;
  public create(userId: string): void;
  public getAccountByUserId(
    userId: string,
    transactionsLimit?: number
  ): Promise<Account | null>;
  public createTransaction(transaction: Transaction, accountId: string): void;
  public transfer(props: TransferProps): void;
}
