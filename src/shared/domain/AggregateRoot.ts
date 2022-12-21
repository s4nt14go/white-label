import { Entity } from './Entity';
import { DomainEventBase } from './events/DomainEventBase';
import { DomainEvents } from './events/DomainEvents';
import { EntityID } from './EntityID';

export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEventBase[] = [];

  get id(): EntityID {
    return this._id;
  }

  get domainEvents(): DomainEventBase[] {
    return this._domainEvents;
  }

  protected addDomainEvent(domainEvent: DomainEventBase): void {
    // Add the domain event to this aggregate's list of domain events
    this._domainEvents.push(domainEvent);
    // Add this aggregate instance to the aggregates list for dispatch
    DomainEvents.markAggregateForDispatch(this);
    // Log the domain event
    this.logDomainEventAdded(domainEvent);
  }

  public clearEvents(): void {
    this._domainEvents.splice(0, this._domainEvents.length);
  }

  private logDomainEventAdded(domainEvent: DomainEventBase): void {
    const thisClass = Object.getPrototypeOf(this);
    const domainEventClass = Object.getPrototypeOf(domainEvent);
    console.info(
      `[Domain Event Created]:`,
      thisClass.constructor.name,
      '==>',
      domainEventClass.constructor.name
    );
  }
}
