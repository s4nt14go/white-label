import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { MalformedRequest } from '../../core/AppError';
import { APIGatewayBase } from './APIGatewayBase';

export abstract class APIGatewayPOST<T> extends APIGatewayBase<T> {
  protected event!: APIGatewayEvent;
  protected _context!: Context;

  public async execute(
    event: APIGatewayEvent,
    _context: Context
  ): Promise<APIGatewayProxyResult> {
    this.event = event;
    this._context = _context;
    if (this.getTransaction) this.transaction = await this.getTransaction();
    try {
      let implResult;
      if (typeof event.body === 'string') {
        let parsed;
        try {
          parsed = JSON.parse(event.body);
        } catch (err) {
          console.log('Malformed request', err);
          return this.fail(new MalformedRequest());
        }
        implResult = await this.executeImpl(parsed);
      } else {
        implResult = await this.executeImpl(event);
      }
      return this.handleImplResult(implResult);
    } catch (err) {
      return this.handleUnexpectedError(err);
    }
  }
}
