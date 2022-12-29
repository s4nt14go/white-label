import { IAccountRepo } from './IAccountRepo';
import { Repository } from '../../../shared/core/Repository';
import { Account } from '../domain/Account';
import { Transaction } from '../domain/Transaction';
import { AccountMap } from '../mappers/AccountMap';
import { TransactionMap } from '../mappers/TransactionMap';
import { TransferProps } from './IAccountRepo';

export enum UserId {
  GOOD = '12345678-1234-1234-1234-123456789012',
  GOOD2 = '12345678-1234-1234-1234-123456789013',
  NO_TRANSACTIONS = '00000000-1234-1234-1234-123456789012',
  TRANSACTIONS_WITHOUT_ACCOUNT = '00000000-0000-0000-0000-123456789012',
}

export class AccountRepoFake extends Repository<Account> implements IAccountRepo {
  private GOOD3 = 'GOOD3';
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
      case this.GOOD3:
      case UserId.GOOD:
      case UserId.GOOD2: {
        const rawAccount = {
          user_id: userId,
          id: 'faked_account_id',
          active: true,
        };
        const transaction = {
          account_id: 'faked_account_id',
          id: 'faked_tx_id',
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
  public createTransaction(transaction: Transaction, accountId: string): void {
    if (transaction.description.value === 'THROW_WHEN_SAVE') throw Error();
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public transfer(props: TransferProps): void {
    return;
  }

  public setGoodUserId(userId: string) {
    this.GOOD3 = userId;
  }
}
