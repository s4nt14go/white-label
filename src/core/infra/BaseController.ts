import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Envelope } from './Envelope';
import { BaseError, UnexpectedError } from '../logic/AppError';

export abstract class BaseController {
  protected abstract executeImpl (dto: any): any;

  public async execute (event: APIGatewayEvent,
                  _context: Context): Promise<APIGatewayProxyResult> {
    try {
      let req = event;
      if (typeof event.body === "string") {
        return await this.executeImpl(JSON.parse(event.body));
      }
      return await this.executeImpl(req);
    } catch (err) {
      console.log(`An unexpected error occurred`, err);
      return this.serverError()
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

  public created () {
    return BaseController.jsonResponse( 201, JSON.stringify(
        { ...Envelope.ok() },
    ));
  }

  public conflict (error: BaseError) {
    return BaseController.jsonResponse( 409, JSON.stringify(
      { ...Envelope.error(error) },
    ));
  }

  public fail (error: BaseError) {
    return BaseController.jsonResponse( 400, JSON.stringify(
    { ...Envelope.error(error) },
    ));
  }

  public serverError () {
    return BaseController.jsonResponse( 500, JSON.stringify(
        { ...Envelope.error(new UnexpectedError()) },
    ));
  }
}