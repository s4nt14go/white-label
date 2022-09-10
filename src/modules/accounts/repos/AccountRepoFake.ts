import { IAccountRepo } from './IAccountRepo';
import { Repository } from '../../../shared/core/Repository';
import { Account } from '../domain/Account';
import { Transaction } from '../domain/Transaction';
import { AccountMap } from '../mappers/AccountMap';
import { TransactionMap } from '../mappers/TransactionMap';
import { TransferProps } from './IAccountRepo';

export enum UserId {
  GOOD = 'GOOD',
  NO_TRANSACTIONS = 'NO_TRANSACTIONS',
  TRANSACTIONS_WITHOUT_ACCOUNT = 'TRANSACTIONS_WITHOUT_ACCOUNT',
}

export class AccountRepoFake extends Repository<Account> implements IAccountRepo {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public create(userId: string): void {
    return;
  }

  public async getAccountByUserId(
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    transactionsLimit = 10
  ): Promise<Account | null> {
    switch (userId) {
      case UserId.GOOD: {
        const rawAccount = {
          user_id: 'good_userId',
          id: 'faked',
          active: true,
        };
        const transaction = {
          user_id: 'good_userId',
          id: 'faked',
          balance: 100,
          delta: 100,
          description: 'faked',
          date: new Date(),
        };
        return AccountMap.toDomain(rawAccount, [
          TransactionMap.toDomain(transaction),
        ]);
      }
      case UserId.NO_TRANSACTIONS:
        return null;
      case UserId.TRANSACTIONS_WITHOUT_ACCOUNT:
        throw Error(`Account not found for userId`);
      default:
        throw Error(`Test error: case for userId ${userId} not handled`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createTransaction(transaction: Transaction, userId: string): void {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public transfer(props: TransferProps): void {
    return;
  }
}
