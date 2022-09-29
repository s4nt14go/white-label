type mutationCreateTransactionResponse = {
  createTransaction: VoidResponse;
};
export type MutationCreateTransactionResponse = {
  data: mutationCreateTransactionResponse;
}

type queryGetAccountByUserIdResponse = {
  getAccountByUserId: AccountResponse;
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
export type QueryGetAccountByUserIdResponse = {
  data: queryGetAccountByUserIdResponse;
}

type mutationTransferResponse = {
  transfer: VoidResponse;
};
type VoidResponse = {
  responseTime: string;
};
export type MutationTransferResponse = {
  data: mutationTransferResponse;
}

type TransactionWithId = {
  balance: number;
  delta: number;
  date: Date;
  description: string;
  id: string;
}
export type NotifyTransactionCreated = {
  accountId: string;
  transaction: TransactionWithId;
}