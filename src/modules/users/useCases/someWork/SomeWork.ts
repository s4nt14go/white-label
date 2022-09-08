import { SubscriberController } from '../../../../shared/core/SubscriberController';
import { UserCreatedEvent } from '../../domain/events/UserCreatedEvent';
import { IExternalService } from '../../services/some';

export class SomeWork extends SubscriberController<UserCreatedEvent> {
  private externalService: IExternalService;

  constructor(externalService: IExternalService) {
    super();
    this.externalService = externalService;
  }

  async executeImpl(event: UserCreatedEvent): Promise<void> {
    const { user } = event;

    await this.externalService.sendToExternal(user);
  }
}
