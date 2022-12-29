import { SubscriberController } from '../../../../shared/core/SubscriberController';
import { IExternalService } from '../../services/some';
import { Request, Response } from './SomeWorkDTOs';
import { ControllerResult } from '../../../../shared/core/ControllerResult';

export class SomeWork extends SubscriberController<Request, Response> {
  private externalService: IExternalService;

  public constructor(externalService: IExternalService) {
    super();
    this.externalService = externalService;
  }

  protected async executeImpl(event: Request): ControllerResult<Response> {
    const { user } = event;

    await this.externalService.sendToExternal(user);

    return { status: 200 };
  }
}
