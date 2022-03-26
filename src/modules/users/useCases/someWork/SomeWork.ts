import { UseCase } from "../../../../core/domain/UseCase";
import { UserCreatedEvent } from '../../domain/events/UserCreatedEvent';
import { IExternalService } from '../../services/some';

export class SomeWork implements UseCase<UserCreatedEvent, Promise<void>> {
  private externalService: IExternalService;

  constructor (externalService: IExternalService) {
    this.externalService = externalService;
  }

  async execute (event: UserCreatedEvent): Promise<void> {
    const { user } = event;

    try {
      await this.externalService.sendToExternal(user);
    } catch (err) {
      console.log(`Error@${this.constructor.name}`, err);
    }
  }

}