import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { APIGatewayBase } from './APIGatewayBase';

export abstract class APIGatewayGET<T> extends APIGatewayBase<T> {
  protected event!: APIGatewayEvent;
  protected _context!: Context;

  public async execute(
    event: APIGatewayEvent,
    _context: Context
  ): Promise<APIGatewayProxyResult> {
    try {
      console.log('event', event);
      console.log('_context', _context);
      const { queryStringParameters } = event;
      const implResult = queryStringParameters? await this.executeImpl(queryStringParameters) : await this.executeImpl(event);
      return this.handleImplResult(implResult);
    } catch (err) {
      return this.handleUnexpectedError(err);
    }
  }
}
