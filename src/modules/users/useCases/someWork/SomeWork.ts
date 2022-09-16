import { BaseSubscriber } from '../../../../shared/core/BaseSubscriber';
import { UserCreatedEvent } from '../../domain/events/UserCreatedEvent';
import { IExternalService } from '../../services/some';

export class SomeWork extends BaseSubscriber<UserCreatedEvent> {
  private externalService: IExternalService;

  public constructor(externalService: IExternalService) {
    super();
    this.externalService = externalService;
  }

  protected async executeImpl(event: UserCreatedEvent): Promise<void> {
    const { user } = event;

    await this.externalService.sendToExternal(user);
  }
}
