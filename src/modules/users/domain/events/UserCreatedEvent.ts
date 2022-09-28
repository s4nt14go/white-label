import { User } from '../User';
import { DomainEventBase } from '../../../../shared/domain/events/DomainEventBase';

export class UserCreatedEvent extends DomainEventBase {
  public user;

  public constructor(user: User) {
    super(user.id.toString());
    this.user = {
      email: user.email.value,
      username: user.username.value,
    };
  }
}
