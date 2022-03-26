import { UserMap } from './userMap';
import { UserCreatedEvent } from '../domain/events/UserCreatedEvent';

export class UserCreatedEventMap {
  public static toDomain (raw: any): UserCreatedEvent {

    const { user: rawUser, dateTimeOccurred } = raw;

    const user = UserMap.toDomain(rawUser);

    return new UserCreatedEvent(user, new Date(dateTimeOccurred));
  }
}