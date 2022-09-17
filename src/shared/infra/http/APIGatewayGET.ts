import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { APIGatewayBase } from './APIGatewayBase';

export abstract class APIGatewayGET<T> extends APIGatewayBase<T> {
  protected event!: APIGatewayEvent;
  protected context!: Context;

  public async execute(
    event: APIGatewayEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    this.event = event;
    this.context = context;

    try {
      const { queryStringParameters } = event;
      const implResult = await this.executeImpl(queryStringParameters)
      return this.handleImplResult(implResult);
    } catch (err) {
      return this.handleUnexpectedError(err);
    }
  }
}
