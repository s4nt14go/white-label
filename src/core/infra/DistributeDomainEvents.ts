import { Dispatcher } from './Dispatcher';
import { IDispatcher } from '../domain/events/DomainEvents';
import { IDomainEvent } from '../domain/events/IDomainEvent';
import { DomainEventTypes } from '../domain/events/DomainEventTypes';
import { Context } from './Context';

const { service, stage } = Context;
const prefix = `${service}-${stage}`;

const { UserCreatedEvent } = DomainEventTypes;

const subscribers = {
    [UserCreatedEvent]: ['notifySlackChannel', 'someWork'],
}

class DistributeDomainEvents {
    private dispatcher: IDispatcher;

    constructor() {
        this.dispatcher = new Dispatcher();
    }

    async execute(
        event: IDomainEvent,
    ) {
        console.log('event', event);

        await Promise.all(subscribers[event.type].map(lambda => {
            return this.dispatcher.dispatch(event,`${prefix}-${lambda}`);
        }));

        if (!subscribers[event.type] || !subscribers[event.type].length) {
            const msg = `Unexpected event`;
            console.log(msg, event, subscribers);
            throw new Error(msg);
        }
    }
}

const distributeDomainEvents = new DistributeDomainEvents();
export const handler = distributeDomainEvents.execute.bind(distributeDomainEvents);