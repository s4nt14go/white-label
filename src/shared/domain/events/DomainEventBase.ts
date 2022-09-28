import { DomainEventTypes } from './DomainEventTypes';

export class DomainEventBase {
  private __proto__: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  public dateTimeOccurred: Date;
  public type: DomainEventTypes;
  public version: number;
  public aggregateId: string;

  protected constructor(aggregateId: string) {
    this.dateTimeOccurred = new Date();
    this.aggregateId = aggregateId;
    this.type = this.__proto__.constructor.name;
    this.version = 0;
  }
}
