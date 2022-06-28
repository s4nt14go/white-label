import '../../../../../environment';
import {
  DomainEvents,
  IDispatcher,
} from '../../../../core/domain/events/DomainEvents';
import { UserCreatedEvent } from '../../domain/events/UserCreatedEvent';
import { UniqueEntityID } from '../../../../core/domain/UniqueEntityID';

const { distributeDomainEvents } = process.env;

export class CreateUserEvents {
  static registration(dispatcher: IDispatcher) {
    DomainEvents.setDispatcher(dispatcher);
    DomainEvents.register(`${distributeDomainEvents}`, UserCreatedEvent.name);
  }
  static async dispatchEventsForAggregates(userId: UniqueEntityID) {
    await DomainEvents.dispatchEventsForAggregate(userId); // NOTE: Dispatch the events after the aggregate changes we're interested to emit (i.e. create, update, delete), are done in the real/faked repository.
  }
}
