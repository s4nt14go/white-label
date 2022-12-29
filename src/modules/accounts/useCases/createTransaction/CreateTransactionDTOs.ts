import { Created } from '../../../../shared/core/Created';
import { RetryableRequest } from '../../../../shared/decorators/IRetryableRequest';

export type Request = RetryableRequest & {
  userId: string;
  description: string;
  delta: number;
}

export type Response = Created;
