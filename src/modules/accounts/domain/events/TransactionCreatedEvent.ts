import { Transaction } from '../Transaction';
import { DomainEventBase } from '../../../../shared/domain/events/DomainEventBase';

export class TransactionCreatedEvent extends DomainEventBase {
  public transaction;

  public constructor(accountId: string, transaction: Transaction) {
    super(accountId);
    this.transaction = {
      id: transaction.id.toString(),
      balance: transaction.balance.value,
      delta: transaction.delta.value,
      date: transaction.date,
      description: transaction.description.value,
    };
  }
}
