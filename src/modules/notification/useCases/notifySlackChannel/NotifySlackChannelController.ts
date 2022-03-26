import { NotifySlackChannel } from "./NotifySlackChannel";
import { UserCreatedEventDTO } from '../../../users/domain/events/UserCreatedEventDTO';
import { UserCreatedEventMap } from '../../../users/mappers/userCreatedEventMap';

export class NotifySlackChannelController {
  private useCase: NotifySlackChannel;

  constructor(useCase: NotifySlackChannel) {
    this.useCase = useCase;
  }

  async executeImpl(dto: UserCreatedEventDTO): Promise<any> {
    console.log(`dto@${this.constructor.name}`, JSON.stringify(dto, null, 2));
    try {
      const userCreatedEvent = UserCreatedEventMap.toDomain(dto)
      await this.useCase.execute(userCreatedEvent);
    } catch (err) {
      console.log(`Error@${this.constructor.name}`, err);
    }
  }
}
