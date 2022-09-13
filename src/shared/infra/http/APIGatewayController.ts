import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Envelope } from '../../core/Envelope';
import { BaseError, MalformedRequest, UnexpectedError } from '../../core/AppError';
import { BaseController } from '../../core/BaseController';

export abstract class APIGatewayController extends BaseController {
  protected abstract executeImpl(
    dto: unknown | APIGatewayEvent
  ): Promise<APIGatewayProxyResult>;

  public async execute(
    event: APIGatewayEvent,
    _context: Context
  ): Promise<APIGatewayProxyResult> {
    if (this.getTransaction) this.transaction = await this.getTransaction();
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
      if (this.transaction) await this.transaction.rollback();
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

  public async ok<T>(result?: T) {
    if (this.transaction) await this.transaction.commit();
    return APIGatewayController.jsonResponse(
      200,
      JSON.stringify({ ...Envelope.ok(result) })
    );
  }

  public async created(result?: { id: string }) {
    if (this.transaction) await this.transaction.commit();
    return APIGatewayController.jsonResponse(201, JSON.stringify({ ...Envelope.ok(result) }));
  }

  public async conflict(error: BaseError) {
    if (this.transaction) await this.transaction.rollback();
    return APIGatewayController.jsonResponse(
      409,
      JSON.stringify({ ...Envelope.error(error) })
    );
  }

  public async fail(error: BaseError) {
    if (this.transaction) await this.transaction.rollback();
    return APIGatewayController.jsonResponse(
      400,
      JSON.stringify({ ...Envelope.error(error) })
    );
  }

  public async serverError(context: Context) {
    if (this.transaction) await this.transaction.rollback();
    return APIGatewayController.jsonResponse(
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
