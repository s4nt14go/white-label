import { IDispatcher } from '../../domain/events/DomainEvents';
import { DomainEventBase } from '../../domain/events/DomainEventBase';

export class DispatcherFake implements IDispatcher {
  public async dispatch(event: DomainEventBase, handler: string) {
    console.log(`${this.constructor.name}.dispatch`, event, handler);
  }
}
