interface Transactions {
  balance: number;
  delta: number;
  date: Date;
  description: string;
}

export interface Response {
  balance: number;
  active: boolean;
  transactions: Transactions[];
}

export interface Request {
  userId: string;
}
