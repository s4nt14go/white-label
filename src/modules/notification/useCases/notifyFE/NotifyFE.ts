import { SubscriberController } from '../../../../shared/core/SubscriberController';
import { Request, Response } from './NotifyFeDTO';
import { ControllerResultAsync } from '../../../../shared/core/BaseController';
import { IFeService } from '../../services/fe/IFeService';

export class NotifyFE extends SubscriberController<Request, Response> {
  private feService: IFeService;

  public constructor(feService: IFeService) {
    super();
    this.feService = feService;
  }

  protected async executeImpl(event: Request): ControllerResultAsync<Response> {
    const { aggregateId: accountId, transaction } = event;

    await this.feService.transactionCreated({
      accountId,
      transaction,
    });

    return { status: 200 };
  }
}
