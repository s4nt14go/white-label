import { AppSyncResolverEvent, Context } from 'aws-lambda';
import { Envelope } from '../../core/Envelope';
import { BaseError } from '../../core/AppError';
import { BaseController, EnvelopUnexpectedError } from '../../core/BaseController';
import { Created } from '../../core/Created';

export const successfulCodes = [200, 201];

type ExeResponse = Promise<
  // executeImpl didn't throw
  // ...if it completed the use case successfully
  | Envelope<unknown | Created>
  // ...if it couldn't complete the use case because of an expected possible error
  | Envelope<BaseError>

  // executeImpl threw
  // ...if it's a db error, retry:
  | void // for lambda retry
  // ....if it's not a db error => handleUnexpectedError > serverError:
  | EnvelopUnexpectedError
>;
export abstract class AppSyncController<Request, Response> extends BaseController<
  AppSyncResolverEvent<Request>,
  Response,
  ExeResponse
> {
  protected event!: AppSyncResolverEvent<Request>;
  protected context!: Context;

  public async execute(
    event: AppSyncResolverEvent<Request>,
    context: Context
  ): ExeResponse {
    this.event = event;
    this.context = context;

    try {
      if (this.getTransaction) this.transaction = await this.getTransaction();
      const implResult = await this.executeImpl(event.arguments);
      if (successfulCodes.includes(implResult.status)) {
        if (this.transaction) await this.handleCommit();
        return Envelope.ok(implResult.result);
      } else {
        console.log('implResult error', implResult);
        return Envelope.error(implResult.result as BaseError);
      }
    } catch (err) {
      return await this.handleUnexpectedError(err);
    }
  }
}
