import {
  DomainEvents,
  IDispatcher,
} from '../../../../shared/domain/events/DomainEvents';
import { TransactionCreatedEvent } from '../../domain/events/TransactionCreatedEvent';

const { distributeDomainEvents } = process.env;

export class CreateTransactionEvents {
  public static registration(dispatcher: IDispatcher) {
    DomainEvents.setDispatcher(dispatcher);
    DomainEvents.register(`${distributeDomainEvents}`, TransactionCreatedEvent.name);
  }
}
