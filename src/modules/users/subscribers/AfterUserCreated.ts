
import { IHandle } from "../../../core/domain/events/IHandle";
import { UserCreatedEvent } from "../domain/events/userCreatedEvent";
import { DomainEvents } from "../../../core/domain/events/DomainEvents";
// import { AssignInitialUsername } from "../useCases/assignInitialUsername/AssignInitialUsername";

export class AfterUserCreated implements IHandle<UserCreatedEvent> {
  // private assignInitialUsername: AssignInitialUsername;

  constructor (/*assignInitialUsername: AssignInitialUsername*/) {
    this.setupSubscriptions();
    // this.assignInitialUsername = assignInitialUsername;
  }

  setupSubscriptions(): void {
    console.log(`Register onUserCreatedEvent for UserCreatedEvent`);
    DomainEvents.register(AfterUserCreated.onUserCreatedEvent.bind(this) as any, UserCreatedEvent.name);
  }

  private static async onUserCreatedEvent (event: UserCreatedEvent): Promise<void> {
    console.log('onUserCreatedEvent!', event);
    const { user } = event;

    console.log('Do some stuff with user...', user);
    // Even throwing here, CreateUserUseCase will return success:
    // Right {
    //   value: Result {
    //     isSuccess: true,
    //     isFailure: false,
    //     error: null,
    //     _value: undefined
    //   }
    // }
    /*await new Promise<void>(resolve => {
      setTimeout(() => {
        throw Error('Throwing error here!');
      }, 2000);
    })*/

    /*this.assignInitialUsername.execute({ user })
      .then((r) => { console.log(r) })
      .catch((err) => { console.log(err) })*/

  }
}