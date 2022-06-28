import { IDispatcher } from '../../domain/events/DomainEvents';
import { IDomainEvent } from '../../domain/events/IDomainEvent';
import { Lambda } from '@aws-sdk/client-lambda';
import stringify = require('json-stringify-safe');
import { TextEncoder } from 'util';

export class DispatcherLambda implements IDispatcher {
  private lambdaClient = new Lambda({});

  async dispatch(event: IDomainEvent, handler: string) {
    const req = {
      FunctionName: handler,
      InvocationType: 'Event',
      Payload: new TextEncoder().encode(stringify(event)),
    };
    console.log('Invoking...', req);
    const result = await this.lambdaClient.invoke(req);
    console.log('Invocation complete', result);
  }
}
