import { SubscriberController } from '../../../../shared/core/SubscriberController';
import { IExternalService } from '../../services/some';
import { Request, Response } from './SomeWorkDTO';
import { ControllerResultAsync } from '../../../../shared/core/BaseController';

export class SomeWork extends SubscriberController<Request, Response> {
  private externalService: IExternalService;

  public constructor(externalService: IExternalService) {
    super();
    this.externalService = externalService;
  }

  protected async executeImpl(event: Request): ControllerResultAsync<Response> {
    const { user } = event;

    await this.externalService.sendToExternal(user);

    return { status: 200 };
  }
}
