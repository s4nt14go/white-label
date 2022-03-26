import { SomeWork } from "./SomeWork";
import { UserCreatedEventDTO } from '../../domain/events/UserCreatedEventDTO';
import { UserCreatedEventMap } from '../../mappers/userCreatedEventMap';

export class SomeWorkController {
  private useCase: SomeWork;

  constructor(useCase: SomeWork) {
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
