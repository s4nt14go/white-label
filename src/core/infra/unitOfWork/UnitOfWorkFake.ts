import { UnitOfWork } from './UnitOfWork';
export class UnitOfWorkFake extends UnitOfWork {
  async commit() {
    console.log(`Transactions for DB:`, this.transactions);
  }
}
