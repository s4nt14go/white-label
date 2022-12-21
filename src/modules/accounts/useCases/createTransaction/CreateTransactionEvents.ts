import {
  DomainEvents,
} from '../../../../shared/domain/events/DomainEvents';
import { TransactionCreatedEvent } from '../../domain/events/TransactionCreatedEvent';
import { IInvoker } from '../../../../shared/infra/invocation/LambdaInvoker';

// Add all process.env used:
const { distributeDomainEvents } = process.env;
if (!distributeDomainEvents) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

export class CreateTransactionEvents {
  public static registration(invoker: IInvoker) {
    DomainEvents.setInvoker(invoker);
    DomainEvents.register(
      `${distributeDomainEvents}`,
      TransactionCreatedEvent.name
    );
  }
}
