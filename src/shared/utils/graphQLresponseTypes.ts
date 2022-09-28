// Types used in tests
type MutationCreateTransactionResponse = {
  createTransaction: VoidResponse;
};

type QueryGetAccountByUserIdResponse = {
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

type MutationTransferResponse = {
  transfer: VoidResponse;
};
type VoidResponse = {
  responseTime: string;
};
export type GraphQLresponse = {
  data: MutationTransferResponse &
    QueryGetAccountByUserIdResponse &
    MutationCreateTransactionResponse;
};
