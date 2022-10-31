import '../../../../environment';
import { DispatcherLambda } from './DispatcherLambda';
import { IDispatcher } from '../../domain/events/DomainEvents';
import { DomainEventBase } from '../../domain/events/DomainEventBase';
import { DomainEventTypes } from '../../domain/events/DomainEventTypes';

// Add all process.env used:
const { notifySlackChannel, someWork, createAccount, notifyFE } = process.env;
if (!notifySlackChannel || !someWork || !createAccount || !notifyFE) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}
const { UserCreatedEvent, TransactionCreatedEvent } = DomainEventTypes;

const subscribers = {
  [UserCreatedEvent]: [notifySlackChannel, someWork, createAccount],
  [TransactionCreatedEvent]: [notifyFE],
};

class DistributeDomainEvents {
  private dispatcher: IDispatcher;

  public constructor() {
    this.dispatcher = new DispatcherLambda();
  }

  public async execute(event: DomainEventBase) {
    console.log('event', event);

    await Promise.all(
      subscribers[event.type].map((lambda) => {
        return this.dispatcher.dispatch(event, lambda);
      })
    );

    if (!subscribers[event.type] || !subscribers[event.type].length) {
      const msg = `Unexpected event`;
      console.log(msg, event, subscribers);
      throw new Error(msg);
    }
  }
}

const distributeDomainEvents = new DistributeDomainEvents();
export const handler = distributeDomainEvents.execute.bind(distributeDomainEvents);
