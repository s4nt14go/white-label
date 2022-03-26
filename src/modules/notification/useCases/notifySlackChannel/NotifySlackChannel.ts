import { UseCase } from "../../../../core/domain/UseCase";
import { ISlackService } from "../../services/slack";
import { UserCreatedEvent } from '../../../users/domain/events/UserCreatedEvent';
import { User } from '../../../users/domain/user';

export class NotifySlackChannel implements UseCase<UserCreatedEvent, Promise<void>> {
  private slackService: ISlackService;

  constructor (slackService: ISlackService) {
    this.slackService = slackService;
  }

  private static craftSlackMessage (user: User): string {
    return `Hey! Guess who just joined us? => ${user.username.value}\n
      Need to reach 'em? Their email is ${user.email.value}.`
  }

  async execute (event: UserCreatedEvent): Promise<void> {
    const { user } = event;

    try {
      await this.slackService.sendMessage(
          NotifySlackChannel.craftSlackMessage(user),
        'growth'
      )
    } catch (err) {
      console.log(`Error@${this.constructor.name}`, err);
    }
  }
}