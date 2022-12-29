import { DomainEventBase } from '../../domain/events/DomainEventBase';
import { Lambda } from '@aws-sdk/client-lambda';
import stringify from 'json-stringify-safe';
import { TextEncoder } from 'util';

export interface IInvoker {
  invoke(event: DomainEventBase, handler: string): unknown;
}

export class LambdaInvoker implements IInvoker {
  private lambdaClient = new Lambda({});

  public async invoke(event: DomainEventBase, handler: string) {
    const req = {
      FunctionName: handler,
      InvocationType: 'Event',
      Payload: new TextEncoder().encode(stringify(event)),
    };
    console.log(`Invoking... ${Math.random()}`, {
      ...req,
      event,
    });
    const result = await this.lambdaClient.invoke(req);
    console.log('Invocation complete', result);
  }
}
