import { SubscriberController } from '../../../../shared/core/SubscriberController';
import { ISlackService } from '../../services/slack';
import { Request, Response } from './NotifySlackChannelDTO';
import { ControllerResultAsync } from '../../../../shared/core/BaseController';

type UserCreatedDTO = {
  email: string;
  username: string;
};

export class NotifySlackChannel extends SubscriberController<Request, Response> {
  private slackService: ISlackService;

  public constructor(slackService: ISlackService) {
    super();
    this.slackService = slackService;
  }

  private static craftSlackMessage(user: UserCreatedDTO): string {
    return `Hey! Guess who just joined us? => ${user.username}\n
      Need to reach 'em? Their email is ${user.email}.`;
  }

  protected async executeImpl(event: Request): ControllerResultAsync<Response> {
    const { user } = event;

    await this.slackService.sendMessage(
      NotifySlackChannel.craftSlackMessage(user),
      'growth'
    );

    return { status: 200 };
  }
}
