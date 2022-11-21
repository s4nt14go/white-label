import { BaseController } from './BaseController';
import { BaseError } from './AppError';
import { Context } from 'aws-lambda';
import { successfulCodes } from '../infra/appsync/AppSyncController';

type ExeResponse = Promise<void>;
export abstract class SubscriberController<
  Request,
  Response
> extends BaseController<Request, Response, ExeResponse> {
  protected event!: Request;
  protected context = {} as Context;

  public async execute(event: Request): ExeResponse {
    this.event = event;

    let implResult;
    try {
      if (this.getTransaction) this.transaction = await this.getTransaction();
      implResult = await this.executeImpl(event);
      if (successfulCodes.includes(implResult.status)) {
        if (this.transaction) await this.handleCommit();
        return;
      }
    } catch (err) {
      await this.handleUnexpectedError(err);
      let message = 'Unexpected Error';
      if (err instanceof Error) {
        message += `: ${err.message}`;
      }
      throw Error(message);
    }
    console.log('implResult error', implResult);
    throw Error((implResult.result as BaseError).type);
  }
}
