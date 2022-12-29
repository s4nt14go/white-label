import { IInvoker, LambdaInvoker } from './LambdaInvoker';
import { DomainEventBase } from '../../domain/events/DomainEventBase';
import { DomainEventTypes } from '../../domain/events/DomainEventTypes';

// Add all process.env used:
const { notifySlackChannel, someWork, createAccount, notifyFE, storeEvent } = process.env;
if (!notifySlackChannel || !someWork || !createAccount || !notifyFE || !storeEvent) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}
const { UserCreatedEvent, TransactionCreatedEvent } = DomainEventTypes;

const subscribers = {
  // Set up permissions in MyStack.ts:
  // Events/keys: allowEmittingDomainEvents
  // Subscribers/values: allowSubscribeToDomainEvents
  [UserCreatedEvent]: [storeEvent, notifySlackChannel, someWork, createAccount],
  [TransactionCreatedEvent]: [storeEvent, notifyFE],
};

class DistributeDomainEvents {
  private invoker: IInvoker;

  public constructor() {
    this.invoker = new LambdaInvoker();
  }

  public async execute(event: DomainEventBase) {
    console.log('event', event);
    console.log(`subscribers[${event.type}]`, subscribers[event.type]);

    await Promise.all(
      subscribers[event.type].map((lambda) => {
        return this.invoker.invoke(event, lambda);
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
