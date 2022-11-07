import { TransactionDTO } from '../../../accounts/domain/events/TransactionCreatedEvent';

export interface IFeService {
  transactionCreated(data: {
    accountId: string;
    transaction: TransactionDTO;
  }): void;
}
