import { IDomainEvent } from '../../../../shared/domain/events/IDomainEvent';
import { User } from '../User';
import { DomainEventTypes } from '../../../../shared/domain/events/DomainEventTypes';

export class UserCreatedEvent implements IDomainEvent {
  public dateTimeOccurred: Date;
  public aggregateId: string;
  public user;
  public type: DomainEventTypes;
  public version: number;

  public constructor(user: User) {
    this.dateTimeOccurred = new Date();
    this.aggregateId = user.id.toString();
    this.user = {
      email: user.email.value,
      username: user.username.value,
    };
    this.type = DomainEventTypes.UserCreatedEvent;
    this.version = 0;
  }
}
