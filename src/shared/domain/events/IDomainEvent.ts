import { DomainEventTypes } from './DomainEventTypes';

export interface IDomainEvent {
  dateTimeOccurred: Date;
  aggregateId: string;
  type: DomainEventTypes;
  version: number;
}
