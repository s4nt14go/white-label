import { UserCreatedEventDTO } from '../../users/domain/events/UserCreatedEvent';
import { IStorage } from './IStorage';
import {
  TransactionCreatedEventDTO,
} from '../../accounts/domain/events/TransactionCreatedEvent';
import { DomainEventBase } from '../../../shared/domain/events/DomainEventBase';

export class StoreService {
  private storage: IStorage;

  public constructor(storage: IStorage) {
    this.storage = storage;
  }

  public async saveUserCreated(event: UserCreatedEventDTO) {
    const { user: { email, username } } = event;

    await this.storage.saveEvent({
      ...DomainEventBase.baseProps(event),
      email,
      username,
    });
  }

  public async saveTransactionCreated(event: TransactionCreatedEventDTO) {
    const { transaction: { id, balance, delta, date, description } } = event;

    await this.storage.saveEvent({
      ...DomainEventBase.baseProps(event),
      id,
      balance,
      delta,
      description,
      date,
    });
  }
}
