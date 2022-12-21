import {
  DomainEvents,
} from '../../../../shared/domain/events/DomainEvents';
import { UserCreatedEvent } from '../../domain/events/UserCreatedEvent';
import { IInvoker } from '../../../../shared/infra/invocation/LambdaInvoker';

// Add all process.env used:
const { distributeDomainEvents } = process.env;
if (!distributeDomainEvents) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

export class CreateUserEvents {
  public static registration(invoker: IInvoker) {
    DomainEvents.setInvoker(invoker);
    DomainEvents.register(`${distributeDomainEvents}`, UserCreatedEvent.name);
  }
}
