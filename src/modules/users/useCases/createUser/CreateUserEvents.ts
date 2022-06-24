import '../../../../../environment';
import {
  DomainEvents,
  IDispatcher,
} from '../../../../core/domain/events/DomainEvents';
import { UserCreatedEvent } from '../../domain/events/UserCreatedEvent';

const { distributeDomainEvents } = process.env;

export class CreateUserEvents {
  static registration(dispatcher: IDispatcher) {
    DomainEvents.setDispatcher(dispatcher);
    DomainEvents.register(`${distributeDomainEvents}`, UserCreatedEvent.name);
  }
}
