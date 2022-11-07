import { EntityID } from '../../../shared/domain/EntityID';
import { Transaction } from '../domain/Transaction';
import { Account } from '../domain/Account';
import { TransactionMap } from './TransactionMap';
import { Response } from '../useCases/getAccountByUserId/GetAccountByUserIdDTOs';

export class AccountMap {
  public static toPersistence(account: Account): {
    balance: number;
    active: boolean;
    id: string;
  } {
    return {
      balance: account.balance().value,
      active: account.props.active,
      id: account.id.toString(),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static toDomain(raw: any, transactions: Transaction[]): Account {
    return Account.create(
      {
        active: raw.active,
        transactions,
      },
      new EntityID(raw.id)
    ).value;
  }

  public static toClient(account: Account): Response {
    const { transactions } = account.props;
    return {
      ...AccountMap.toPersistence(account),
      transactions: transactions.map(TransactionMap.toPersistence),
    };
  }
}
