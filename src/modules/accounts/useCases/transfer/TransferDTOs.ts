import { RetryableRequest } from '../../../../shared/decorators/IRetryableRequest';

export type Request = RetryableRequest & {
  fromUserId: string;
  toUserId: string;
  quantity: number;
  fromDescription: string;
  toDescription?: string;
}

export type Response = {
  fromTransaction: string;
  toTransaction: string;
}
