import { IDomainEvent } from '../../../../core/domain/events/IDomainEvent';
import { User } from '../user';
import { DomainEventTypes } from '../../../../core/domain/events/DomainEventTypes';

export class UserCreatedEvent implements IDomainEvent {
  public dateTimeOccurred: Date;
  public aggregateId: string;
  public user;
  public type: DomainEventTypes;
  public version: number;

  constructor(user: User) {
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
