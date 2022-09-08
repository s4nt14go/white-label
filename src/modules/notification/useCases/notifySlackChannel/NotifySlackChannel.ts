import { SubscriberController } from '../../../../shared/core/SubscriberController';
import { ISlackService } from '../../services/slack';
import { UserCreatedEvent } from '../../../users/domain/events/UserCreatedEvent';

type UserCreatedDTO = {
  email: string;
  username: string;
};

export class NotifySlackChannel
  extends SubscriberController<UserCreatedEvent>
{
  private slackService: ISlackService;

  constructor(slackService: ISlackService) {
    super();
    this.slackService = slackService;
  }

  private static craftSlackMessage(user: UserCreatedDTO): string {
    return `Hey! Guess who just joined us? => ${user.username}\n
      Need to reach 'em? Their email is ${user.email}.`;
  }

  async executeImpl(event: UserCreatedEvent): Promise<void> {
    const { user } = event;

    await this.slackService.sendMessage(
      NotifySlackChannel.craftSlackMessage(user),
      'growth'
    );
  }
}
