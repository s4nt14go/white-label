import {
  AppSyncResolverEvent,
  Context,
} from 'aws-lambda';
import { Envelope } from '../../core/Envelope';
import { BaseError, UnexpectedError } from '../../core/AppError';
import { BaseController } from '../../core/BaseController';
import { Created } from '../../core/Created';
import { CommitResult } from '../../core/BaseTransaction';

type EnvelopUnexpectedT = Envelope<BaseError> | {
  logGroup: string;
  logStream: string;
  awsRequest: string;
}

export abstract class AppSyncController<
  ResponseT,
  RequestT
> extends BaseController<ResponseT, AppSyncResolverEvent<RequestT>> {
  protected event!: AppSyncResolverEvent<RequestT>;
  protected context!: Context;
  
  public async execute(
    event: AppSyncResolverEvent<RequestT>,
    context: Context
  ): Promise<
    | Envelope<ResponseT | Created>
    | { error: Envelope<BaseError> }
    | { error: EnvelopUnexpectedT }
  > {
    this.event = event;
    this.context = context;

    try {
      if (this.getTransaction) this.transaction = await this.getTransaction();
      const implResult = await this.executeImpl(event.arguments);
      if (implResult.status === 200 || implResult.status === 201) {
        if (this.transaction) return await this.handleCommit(implResult);
        return Envelope.ok(implResult.result as ResponseT | Created);
      } else {
        return {
          error: Envelope.error(implResult.result as BaseError),
        };
      }
    } catch (err) {
      return this.handleUnexpectedError(err);
    }
  }

  private async handleCommit(result: unknown) {
    const r = await this.commitWithRetry();
    const { SUCCESS, RETRY, ERROR, EXHAUSTED } = CommitResult;
    switch (r) {
      case SUCCESS:
        return Envelope.ok(result as ResponseT | Created);
      case RETRY:
        return await this.execute(this.event, this.context);
      case ERROR:
      case EXHAUSTED:
      default:
        return await this.handleUnexpectedError(`Error when committing: ${r}`);
    }
  }

  protected async serverError(context: Context): Promise<{ error: EnvelopUnexpectedT}> {
    if (this.transaction)
      try {
        // guard against the error being because of the rollback itself
        await this.transaction.rollback();
      } catch (e) {
        console.log('Error when rolling back inside serverError', e);
      }
    return {
      error: {
        ...Envelope.error(new UnexpectedError()),
        logGroup: context.logGroupName,
        logStream: context.logStreamName,
        awsRequest: context.awsRequestId,
      },
    };
  }
}
