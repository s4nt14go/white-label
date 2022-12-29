import { DomainEventBase } from '../../domain/events/DomainEventBase';
import { IInvoker } from './LambdaInvoker';
import { ExeResponse } from '../../decorators/IDecorator';

export class LambdaInvokerFake implements IInvoker {
  public async invoke(event: DomainEventBase, handler: string) {
    console.log(`${this.constructor.name}.invokeEventHandler`, event, handler);
  }

  public async invokeExecute(): ExeResponse {
    throw Error('TBI');
  }
}
