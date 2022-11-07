import { Transaction } from '../Transaction';
import {
  DomainEventBase,
  DomainEventBaseDTO,
} from '../../../../shared/domain/events/DomainEventBase';

export type TransactionDTO = {
  id: string;
  balance: number;
  delta: number;
  date: string;
  description: string;
}
export type TransactionCreatedEventDTO = DomainEventBaseDTO & {
  transaction: TransactionDTO
}

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

  public toDTO(): TransactionCreatedEventDTO {
    return {
      ...DomainEventBase.baseProps(this),
      dateTimeOccurred: this.dateTimeOccurred.toString(),
      transaction: {
        ...this.transaction,
        date: this.transaction.date.toJSON(),
      },
    }
  }
}
