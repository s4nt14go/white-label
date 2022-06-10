import { DomainEventTypes } from './DomainEventTypes';

export interface IDomainEvent {
  dateTimeOccurred: Date;
  aggregateId: string;
  type: DomainEventTypes.UserCreatedEvent;
  version: number;
}
