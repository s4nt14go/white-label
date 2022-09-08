import {
  DomainEvents,
  IDispatcher,
} from '../../../../shared/domain/events/DomainEvents';
import { UserCreatedEvent } from '../../domain/events/UserCreatedEvent';

const { distributeDomainEvents } = process.env;

export class CreateUserEvents {
  public static registration(dispatcher: IDispatcher) {
    DomainEvents.setDispatcher(dispatcher);
    DomainEvents.register(`${distributeDomainEvents}`, UserCreatedEvent.name);
  }
}
