import { DomainEventBase } from '../../domain/events/DomainEventBase';
import { Lambda } from '@aws-sdk/client-lambda';
import stringify from 'json-stringify-safe';
import { TextEncoder } from 'util';

export interface IInvoker {
  invokeEventHandler(event: DomainEventBase, handler: string): unknown;
  invokeExecute(request: unknown, handler: string): unknown;
}

enum InvocationType {
  RequestResponse = 'RequestResponse',
  Event = 'Event',
}

export class LambdaInvoker implements IInvoker {
  private lambdaClient = new Lambda({});

  public async invokeEventHandler(event: DomainEventBase, handler: string) {
    await this.invoke(event, handler, InvocationType.Event);
  }

  public async invokeExecute(request: unknown, handler: string) {
    return await this.invoke(request, handler, InvocationType.RequestResponse);
  }

  private async invoke(payload: unknown, handler: string, type: InvocationType) {
    const req = {
      FunctionName: handler,
      InvocationType: type,
      Payload: new TextEncoder().encode(stringify(payload)),
    };
    console.log('Invoking...', {
      ...req,
      payload,
    });
    const result = await this.lambdaClient.invoke(req);
    console.log('Invocation complete', result);
  }
}
