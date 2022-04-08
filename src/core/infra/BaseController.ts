import { APIGatewayEvent, APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Envelope } from './Envelope';

export abstract class BaseController {
  protected abstract executeImpl (req: APIGatewayProxyEvent): Promise<void | any>;

  public async execute (event: APIGatewayEvent,
                  _context: Context): Promise<APIGatewayProxyResult> {
    try {
      let req = event;
      if (typeof event.body === "string") {
        req.body = JSON.parse(event.body);
      }
      return await this.executeImpl(req);
    } catch (err) {
      return this.fail('An unexpected error occurred')
    }

  }

  public static jsonResponse (code: number, body: string) {
    return {
      statusCode: code,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body,
    };
  }

  public ok<T> (result?: T) {
    return BaseController.jsonResponse( 200, JSON.stringify(
        { ...Envelope.ok(result) },
    ));
  }

  public conflict (message?: string) {
    return BaseController.jsonResponse( 409, JSON.stringify(
      { ...Envelope.error(message? message : 'Conflict') },
    ));
  }

  public fail (error: Error | string) {
    return BaseController.jsonResponse( 500, JSON.stringify(
    { ...Envelope.error(error.toString()) },
    ));
  }
}