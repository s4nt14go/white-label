import { DomainEventTypes } from './DomainEventTypes';

export type DomainEventBaseDTO = {
  dateTimeOccurred: string;
  aggregateId: string;
  type: string;
  version: number;
}

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

  public static baseProps(eventBase: DomainEventBase | DomainEventBaseDTO): DomainEventBaseDTO {
    const { dateTimeOccurred: _dateTimeOccurred, aggregateId, type, version } = eventBase;

    let dateTimeOccurred;
    switch (typeof _dateTimeOccurred) {
      case 'object':  // eventBase.dateTimeOccurred is a Date, convert into a string
        dateTimeOccurred = _dateTimeOccurred.toJSON();
        break;
      case 'string':
        dateTimeOccurred = _dateTimeOccurred;
        break;
    }
    return { dateTimeOccurred, aggregateId, type, version };
  }
}
