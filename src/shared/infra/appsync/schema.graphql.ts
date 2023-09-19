// These are the TypeScript types counterparts of GraphQL types
// Once the data enters the TypeScript boundary they are simple dto so some types are cast to primitives:
// Date, NotificationTypes and NotificationTargets to string

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
  date: string;
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

export type NotifyTransactionCreatedInput = {
  type: string;
  target: string;
  accountId: string;
  transaction: TransactionWithIdInput;
}
type TransactionWithIdInput = {
  balance: number;
  delta: number;
  date: string;
  description: string;
  id: string;
}

export type TransactionCreatedNotification = {
  type: string;
  target: string;
  accountId: string;
  transaction: TransactionWithId;
};
type TransactionWithId = {
  balance: number;
  delta: number;
  date: string;
  description: string;
  id: string;
};
