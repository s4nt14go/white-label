import { RetryableRequest } from '../../../../shared/decorators/IRetryableRequest';

type Transactions = {
  balance: number;
  delta: number;
  date: Date;
  description: string;
}

export type Response = {
  balance: number;
  active: boolean;
  transactions: Transactions[];
}

export type Request = RetryableRequest & {
  userId: string;
}
