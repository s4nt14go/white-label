import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Envelope } from '../../core/Envelope';
import { BaseError, UnexpectedError } from '../../core/AppError';
import { BaseController, ControllerResult } from '../../core/BaseController';
import { Status } from '../../core/Status';
import { Created } from '../../core/Created';
import { CommitResult } from '../../core/BaseTransaction';

const { OK, CONFLICT, BAD_REQUEST, INTERNAL_ERROR, CREATED } = Status;

export abstract class APIGatewayBase<T> extends BaseController<
  T,
  APIGatewayEvent
> {
  public abstract execute(
    event: APIGatewayEvent,
    context: Context
  ): Promise<APIGatewayProxyResult>;

  protected abstract event: APIGatewayEvent;
  protected abstract context: Context;

  public static jsonResponse(code: number, result: unknown) {
    return {
      statusCode: code,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  }

  public handleImplResult({ status, result }: ControllerResult<T>) {
    switch (status) {
      case OK:
        return this.ok(result);
      case CREATED:
        return this.created(result as Created);
      case CONFLICT:
        return this.conflict(result as BaseError);
      case BAD_REQUEST:
        return this.fail(result as BaseError);
      default:
        console.log(`Unhandled status result: ${status}`);
        return this.handleUnexpectedError(result);
    }
  }

  public async ok<T>(result?: T) {
    if (this.transaction) return await this.handleCommit(result, OK);
    return APIGatewayBase.jsonResponse(OK, Envelope.ok(result));
  }

  public async created(result?: Created) {
    if (this.transaction) return await this.handleCommit(result, CREATED);
    return APIGatewayBase.jsonResponse(CREATED, Envelope.ok(result));
  }

  private async handleCommit(result: unknown, status: number) {
    const r = await this.commitWithRetry();
    const { SUCCESS, RETRY, ERROR, EXHAUSTED } = CommitResult;
    switch (r) {
      case SUCCESS:
        return APIGatewayBase.jsonResponse(status, Envelope.ok(result));
      case RETRY:
        return await this.execute(this.event, this.context);
      case ERROR:
      case EXHAUSTED:
      default:
        return await this.handleUnexpectedError(`Error when committing: ${r}`);
    }
  }

  public async conflict(error: BaseError) {
    if (this.transaction) await this.transaction.rollback();
    return APIGatewayBase.jsonResponse(CONFLICT, Envelope.error(error));
  }

  public async fail(error: BaseError) {
    if (this.transaction) await this.transaction.rollback();
    return APIGatewayBase.jsonResponse(BAD_REQUEST, Envelope.error(error));
  }

  protected async serverError(context: Context) {
    if (this.transaction)
      try {
        // guard against the error being because of the rollback itself
        await this.transaction.rollback();
      } catch (e) {
        console.log('Error when rolling back inside serverError', e);
      }
    return APIGatewayBase.jsonResponse(INTERNAL_ERROR, {
      ...Envelope.error(new UnexpectedError()),
      logGroup: context.logGroupName,
      logStream: context.logStreamName,
      awsRequest: context.awsRequestId,
    });
  }
}
