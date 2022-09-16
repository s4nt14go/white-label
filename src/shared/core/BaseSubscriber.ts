import { BaseTransaction } from './BaseTransaction';

export abstract class BaseSubscriber<T> extends BaseTransaction {
  protected abstract executeImpl(dto: T): void;

  public async execute(dto: T): Promise<void> {
    if (this.getTransaction) this.transaction = await this.getTransaction();
    try {
      await this.executeImpl(dto);
      if (this.transaction) await this.transaction.commit();
    } catch (err) {
      console.log(`An unexpected error occurred`, err);
      console.log(`dto`, dto);
      if (this.transaction) await this.transaction.rollback();
    }
  }
}
