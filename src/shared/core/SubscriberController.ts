import { BaseController } from './BaseController';

export abstract class SubscriberController<IRequest> extends BaseController {
  protected abstract executeImpl(request?: IRequest): void;

  public async execute(dto: IRequest): Promise<void> {
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
