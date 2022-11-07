export interface Request {
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
