import { NotificationTypes } from '../../../modules/notification/domain/NotificationTypes';
import { NotificationTargets } from '../../../modules/notification/domain/NotificationTargets';

export type MutationCreateUserResponse = {
  data: {
    createUser: IdResponse;
  };
};
export type MutationCreateTransactionResponse = {
  data: {
    createTransaction: IdResponse;
  };
};
type IdResponse = {
  id: string;
  responseTime: string;
};

export type QueryGetAccountByUserIdResponse = {
  data: {
    getAccountByUserId: AccountResponse;
  };
};
type AccountResponse = {
  balance: number;
  active: boolean;
  transactions: Transaction[];
  response_time: string;
};
type Transaction = {
  balance: number;
  delta: number;
  date: Date;
  description: string;
};

export type MutationTransferResponse = {
  data: {
    transfer: TransferResponse;
  };
};
type TransferResponse = {
  fromTransaction: string;
  toTransaction: string;
  responseTime: string;
};

export type NotifyTransactionCreatedData = {
  accountId: string;
  transaction: TransactionWithId;
};
type TransactionWithId = {
  balance: number;
  delta: number;
  date: Date;
  description: string;
  id: string;
};
export type TransactionCreatedNotification = {
  type: NotificationTypes;
  target: NotificationTargets;
  accountId: string;
  transaction: TransactionWithId;
};
