import { IDispatcher } from '../../domain/events/DomainEvents';
import { DomainEventBase } from '../../domain/events/DomainEventBase';
import { Lambda } from '@aws-sdk/client-lambda';
import stringify from 'json-stringify-safe';
import { TextEncoder } from 'util';

export class DispatcherLambda implements IDispatcher {
  private lambdaClient = new Lambda({});

  public async dispatch(event: DomainEventBase, handler: string) {
    const req = {
      FunctionName: handler,
      InvocationType: 'Event',
      Payload: new TextEncoder().encode(stringify(event)),
    };
    console.log('Invoking...', {
      ...req,
      event,
    });
    const result = await this.lambdaClient.invoke(req);
    console.log('Invocation complete', result);
  }
}
