import { Context } from '../../../../core/infra/Context';
import { DomainEvents, IDispatcher } from '../../../../core/domain/events/DomainEvents';
import { UserCreatedEvent } from '../../domain/events/UserCreatedEvent';

const { service, stage } = Context;
const prefix = `${service}-${stage}`;

export class CreateUserEvents {
    static registration(dispatcher: IDispatcher) {
        DomainEvents.setDispatcher(dispatcher);
        DomainEvents.register(`${prefix}-distributeDomainEvents`, UserCreatedEvent.name);
    }
}