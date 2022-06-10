import { IDispatcher } from '../domain/events/DomainEvents';
import { IDomainEvent } from '../domain/events/IDomainEvent';

export class DispatcherFake implements IDispatcher {
  async dispatch(event: IDomainEvent, handler: string) {
    console.log(`${this.constructor.name}.dispatch`, event, handler);
  }
}
