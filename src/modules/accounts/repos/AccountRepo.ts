import { Account } from '../domain/Account';
import { TransactionMap } from '../mappers/TransactionMap';
import { Transaction } from '../domain/Transaction';
import { AccountMap } from '../mappers/AccountMap';
import { Repository } from '../../../shared/core/Repository';
import { IAccountRepo } from './IAccountRepo';

export class AccountRepo extends Repository<Account> implements IAccountRepo {
  private Account: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  private Transaction: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public constructor(models: any) {
    super();
    // Put this.transaction in all repos queries: this.<Model>.<find/create/destroy/etc>({...}, { transaction: this.transaction })
    // If no getTransaction is passed to controller/use case, it's null and doesn't have effect (SQL transaction isn't' used)
    this.Account = models.Account;
    this.Transaction = models.Transaction;
  }

  public async getTransactions(
    userId: string,
    transactionsLimit = 10
  ): Promise<Transaction[] | null> {
    const rawTransactions = await this.Transaction.findAll({
      where: { userId },
      order: [['date', 'DESC']],
      limit: transactionsLimit,
      transaction: this.transaction,
    });
    if (!rawTransactions) return null;
    return rawTransactions.map(TransactionMap.toDomain);
  }

  public async getAccountByUserId(
    userId: string,
    transactionsLimit = 10
  ): Promise<Account | null> {
    const transactions = await this.getTransactions(userId, transactionsLimit);
    if (!transactions) return null;
    const rawAccount = await this.Account.findOne(
      {
        where: { userId },
      },
      { transaction: this.transaction }
    );

    if (!rawAccount) throw Error(`Account not found for userId ${userId}`);
    return AccountMap.toDomain(rawAccount, transactions);
  }

  public async create(userId: string, newAccount: Account): Promise<void> {
    const rawAccount = AccountMap.toPersistence(newAccount);
    await this.Account.create(
      {
        ...rawAccount,
        userId,
      },
      { transaction: this.transaction }
    );
    const initialTransaction = newAccount.transactions[0];
    const rawTransaction = TransactionMap.toPersistence(initialTransaction);
    await this.Transaction.create(
      {
        ...rawTransaction,
        userId,
      },
      { transaction: this.transaction }
    );
  }

  public async deleteByUserId(userId: string): Promise<void> {
    await this.Account.destroy(
      { where: { userId } },
      { transaction: this.transaction }
    );
    await this.Transaction.destroy(
      { where: { userId } },
      { transaction: this.transaction }
    );
  }
}
