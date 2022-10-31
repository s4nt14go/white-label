import { Account } from '../domain/Account';
import { TransactionMap } from '../mappers/TransactionMap';
import { Transaction } from '../domain/Transaction';
import { AccountMap } from '../mappers/AccountMap';
import { Repository } from '../../../shared/core/Repository';
import { IAccountRepo, TransferProps } from './IAccountRepo';

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
    accountId: string,
    transactionsLimit = 10
  ): Promise<Transaction[] | null> {
    const rawTransactions = await this.Transaction.findAll({
      where: { accountId },
      order: [['date', 'DESC']],
      limit: transactionsLimit,
      transaction: this.transaction,
    });
    if (!rawTransactions.length) return null;
    return rawTransactions.map(TransactionMap.toDomain);
  }

  public async getAccountByUserId(
    userId: string,
    transactionsLimit = 10
  ): Promise<Account | null> {
    transactionsLimit = transactionsLimit < 1 ? 1 : transactionsLimit;
    const rawAccount = await this.Account.findOne(
      {
        where: { userId },
      },
      { transaction: this.transaction }
    );
    if (!rawAccount) return null;
    const transactions = await this.getTransactions(
      rawAccount.id,
      transactionsLimit
    );
    if (!transactions) throw Error(`No transactions for account ${rawAccount.id}`);
    return AccountMap.toDomain(rawAccount, transactions);
  }

  public async createTransaction(
    transaction: Transaction,
    accountId: string
  ): Promise<void> {
    const raw = TransactionMap.toPersistence(transaction);
    await this.Transaction.create(
      {
        ...raw,
        accountId,
      },
      { transaction: this.transaction }
    );
  }

  public async transfer(props: TransferProps) {
    const { from, to } = props;

    await this.createTransaction(from.transaction, from.accountId);
    await this.createTransaction(to.transaction, to.accountId);
  }

  public async create(userId: string): Promise<Account> {
    const newAccount = Account.Initial();
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
        accountId: newAccount.id.toString(),
      },
      { transaction: this.transaction }
    );
    return newAccount;
  }

  // Delete account and transactions
  public async deleteByUserId(userId: string): Promise<void> {
    const account = await this.getAccountByUserId(userId);
    if (!account)
      return console.log(`No account for userId ${userId}, so nothing is deleted`);
    await this.Transaction.destroy(
      { where: { accountId: account.id.toString() } },
      { transaction: this.transaction }
    );
    await this.Account.destroy(
      { where: { userId } },
      { transaction: this.transaction }
    );
  }
}
