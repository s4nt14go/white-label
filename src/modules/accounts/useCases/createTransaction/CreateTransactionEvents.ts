import {
  DomainEvents,
  IDispatcher,
} from '../../../../shared/domain/events/DomainEvents';
import { TransactionCreatedEvent } from '../../domain/events/TransactionCreatedEvent';

// Add all process.env used:
const { distributeDomainEvents } = process.env;
if (!distributeDomainEvents) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

export class CreateTransactionEvents {
  public static registration(dispatcher: IDispatcher) {
    DomainEvents.setDispatcher(dispatcher);
    DomainEvents.register(
      `${distributeDomainEvents}`,
      TransactionCreatedEvent.name
    );
  }
}
