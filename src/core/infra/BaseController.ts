import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Envelope } from './Envelope';
import { BaseError, MalformedRequest, UnexpectedError } from '../logic/AppError';

export abstract class BaseController {
  protected abstract executeImpl(
    dto: unknown | APIGatewayEvent
  ): Promise<APIGatewayProxyResult>;

  public async execute(
    event: APIGatewayEvent,
    _context: Context
  ): Promise<APIGatewayProxyResult> {
    try {
      if (typeof event.body === 'string') {
        let parsed;
        try {
          parsed = JSON.parse(event.body);
        } catch (err) {
          console.log('Malformed request', err);
          return this.fail(new MalformedRequest());
        }
        return await this.executeImpl(parsed);
      }
      return await this.executeImpl(event);
    } catch (err) {
      console.log(`An unexpected error occurred`, err);
      console.log(`Context`, _context);
      console.log(`Event`, event);
      return this.serverError(_context);
    }
  }

  public static jsonResponse(code: number, body: string) {
    return {
      statusCode: code,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body,
    };
  }

  public ok<T>(result?: T) {
    return BaseController.jsonResponse(
      200,
      JSON.stringify({ ...Envelope.ok(result) })
    );
  }

  public created(id: string) {
    return BaseController.jsonResponse(
      201,
      JSON.stringify({ ...Envelope.ok({ id }) })
    );
  }

  public conflict(error: BaseError) {
    return BaseController.jsonResponse(
      409,
      JSON.stringify({ ...Envelope.error(error) })
    );
  }

  public fail(error: BaseError) {
    return BaseController.jsonResponse(
      400,
      JSON.stringify({ ...Envelope.error(error) })
    );
  }

  public serverError(context: Context) {
    return BaseController.jsonResponse(
      500,
      JSON.stringify({
        ...Envelope.error(new UnexpectedError()),
        logGroup: context.logGroupName,
        logStream: context.logStreamName,
        awsRequest: context.awsRequestId,
      })
    );
  }
}
