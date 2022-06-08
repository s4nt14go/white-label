import { DomainEvents, IDispatcher } from '../../../../core/domain/events/DomainEvents';
import { UserCreatedEvent } from '../../domain/events/UserCreatedEvent';
import { Env } from '../../../../core/infra/Env';

const { distributeDomainEvents } = Env;

export class CreateUserEvents {
    static registration(dispatcher: IDispatcher) {
        DomainEvents.setDispatcher(dispatcher);
        DomainEvents.register(`${distributeDomainEvents}`, UserCreatedEvent.name);
    }
}