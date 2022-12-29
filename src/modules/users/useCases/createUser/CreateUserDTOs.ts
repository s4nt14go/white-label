import { Created } from '../../../../shared/core/Created';
import { RetryableRequest } from '../../../../shared/decorators/IRetryableRequest';

export type Request = RetryableRequest & {
  email: string;
  password: string;
  username: string;
  alias?: string;
}

export type Response = Created;
