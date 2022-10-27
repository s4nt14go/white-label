export type MutationCreateTransactionResponse = {
  data: {
    createTransaction: VoidResponse;
  };
};
type VoidResponse = {
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
    transfer: VoidResponse;
  };
};

export type NotifyTransactionCreatedInput = {
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
