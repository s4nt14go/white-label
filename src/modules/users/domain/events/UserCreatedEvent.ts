import { User } from '../User';
import {
  DomainEventBase,
  DomainEventBaseDTO,
} from '../../../../shared/domain/events/DomainEventBase';

export type UserCreatedEventDTO = DomainEventBaseDTO & {
  user: {
    email: string;
    username: string;
  },
}

export class UserCreatedEvent extends DomainEventBase {
  public user;

  public constructor(user: User) {
    super(user.id.toString());
    this.user = {
      email: user.email.value,
      username: user.username.value,
    };
  }

  public toDTO(): UserCreatedEventDTO {
    return {
      ...DomainEventBase.baseProps(this),
      dateTimeOccurred: this.dateTimeOccurred.toJSON(),
      user: this.user,
    }
  }
}
