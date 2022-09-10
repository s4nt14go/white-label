export interface TransferDTO {
  fromUserId: string;
  toUserId: string;
  quantity: number;
  fromDescription: string;
  toDescription?: string;
}
