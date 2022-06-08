import { IDispatcher } from '../domain/events/DomainEvents';
import { IDomainEvent } from '../domain/events/IDomainEvent';

const { Lambda } = require("@aws-sdk/client-lambda");
const stringify = require('json-stringify-safe');
const { TextEncoder } = require('util');

export class Dispatcher implements IDispatcher {
  private lambdaClient = new Lambda({});

  async dispatch (event: IDomainEvent, handler: string){
    let req = {
      FunctionName: handler,
      InvocationType: 'Event',
      Payload: new TextEncoder().encode(stringify(event)),
    };
    console.log('Invoking...', req);
    const result = await this.lambdaClient.invoke(req);
    console.log('Invocation complete', result);
  }
}