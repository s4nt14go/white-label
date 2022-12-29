import { UserCreatedEventDTO } from '../../../users/domain/events/UserCreatedEvent';
import { RetryableRequest } from '../../../../shared/decorators/IRetryableRequest';

export type Request = RetryableRequest & UserCreatedEventDTO;
export type Response = void;
