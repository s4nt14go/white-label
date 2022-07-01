type Put = {
  ['Put']: {
    TableName: string;
    Item: Record<string, unknown>;
  };
};

export abstract class UnitOfWork {
  protected transactions: Put[] = [];

  clear() {
    this.transactions = [];
  }

  addTransaction(transaction: Put) {
    this.transactions.push(transaction);
    if (this.transactions.length > 25) {
      console.log('transactions:', this.transactions);
      throw new Error(
        'Call to DocumentClient.transactWrite not implemented for more than 25 transactions'
      );
    }
  }

  abstract commit(): Promise<unknown>;
}
