import { DomainEventBase } from '../../domain/events/DomainEventBase';
import { IInvoker } from './LambdaInvoker';

export class LambdaInvokerFake implements IInvoker {
  public async invoke(event: DomainEventBase, handler: string) {
    console.log(`${this.constructor.name}.invokeEventHandler`, event, handler);
  }
}
