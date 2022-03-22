
import { IHandle } from "../../../core/domain/events/IHandle";
import { DomainEvents } from "../../../core/domain/events/DomainEvents";
import { UserCreatedEvent } from "../../users/domain/events/userCreatedEvent";
import { NotifySlackChannel } from "../useCases/notifySlackChannel/NotifySlackChannel";
import { User } from "../../users/domain/user";

export class AfterUserCreated implements IHandle<UserCreatedEvent> {
  private notifySlackChannel: NotifySlackChannel;

  constructor (notifySlackChannel: NotifySlackChannel) {
    this.setupSubscriptions();
    this.notifySlackChannel = notifySlackChannel;
  }

  setupSubscriptions(): void {
    DomainEvents.register(this.onUserCreatedEvent.bind(this) as any, UserCreatedEvent.name);
  }

  private static craftSlackMessage (user: User): string {
    return `Hey! Guess who just joined us? => ${user.username}\n
      Need to reach 'em? Their email is ${user.email.value}.`
  }

  private async onUserCreatedEvent (event: UserCreatedEvent): Promise<void> {
    const { user } = event;

    try {
      await this.notifySlackChannel.execute({
        channel: 'growth',
        message: AfterUserCreated.craftSlackMessage(user)
      })
    } catch (err) {
      console.log(err);
    }
  }
}