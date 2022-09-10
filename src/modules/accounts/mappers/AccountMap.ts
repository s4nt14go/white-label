import { EntityID } from '../../../shared/domain/EntityID';
import { Transaction } from '../domain/Transaction';
import { Account } from '../domain/Account';

export class AccountMap {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static toPersistence(account: Account): any {
    const { balance, active } = account.props;
    return {
      balance: balance.value,
      active,
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
}
