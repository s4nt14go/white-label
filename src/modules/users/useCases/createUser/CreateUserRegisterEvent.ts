import { Context } from '../../../../core/infra/Context';
import { DomainEvents, IDispatcher } from '../../../../core/domain/events/DomainEvents';
import { UserCreatedEvent } from '../../domain/events/UserCreatedEvent';

const { service, stage } = Context;
const prefix = `${service}-${stage}`;

export class CreateUserRegisterEvent {
    private readonly dispatcher: IDispatcher;

    constructor(dispatcher: IDispatcher) {
        this.dispatcher = dispatcher;
        new DomainEvents(this.dispatcher);
        DomainEvents.register(`${prefix}-distributeDomainEvents`, UserCreatedEvent.name);
    }
}