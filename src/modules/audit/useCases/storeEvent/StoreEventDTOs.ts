import {
  UserCreatedEventDTO,
} from '../../../users/domain/events/UserCreatedEvent';
import {
  TransactionCreatedEventDTO,
} from '../../../accounts/domain/events/TransactionCreatedEvent';

export type Request = UserCreatedEventDTO | TransactionCreatedEventDTO;
export type Response = void;
