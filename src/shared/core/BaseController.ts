import { BaseError, UnexpectedError } from './AppError';
import { Created } from './Created';
import { BaseTransaction, CommitResult } from './BaseTransaction';
import { Context } from 'aws-lambda';
import { ConnectionAcquireTimeoutError } from 'sequelize';
import { Envelope } from './Envelope';

export type EnvelopUnexpectedT =
  | Envelope<BaseError>
  | {
      logGroup: string;
      logStream: string;
      awsRequest: string;
    };

export type ControllerResult<T> = {
  status: number;
  result?: T | BaseError | Created;
};
export type ControllerResultAsync<T> = Promise<ControllerResult<T>>;

export abstract class BaseController<
  Request,
  Response,
  ExeResponse
> extends BaseTransaction {
  protected abstract executeImpl(dto: unknown | Request): ControllerResultAsync<Response>;
  protected abstract execute(event: Request, context: Context): ExeResponse;
  protected abstract event: Request;
  protected abstract context: Context;
  private dbConnTimeoutErrors = 0;
  private maxDbConnTimeoutErrors = 3;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly renewConn?: any;

  protected async serverError(
    context: Context
  ): Promise<{ error: EnvelopUnexpectedT }> {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected constructor(renewConn?: any, getTransaction?: any) {
    super(getTransaction);
    this.renewConn = renewConn;
  }

  protected async handleCommit() {
    const r = await this.commitWithRetry();
    const { SUCCESS, RETRY, ERROR, EXHAUSTED } = CommitResult;
    switch (r) {
      case SUCCESS:
        return;
      case RETRY:
        return this.execute(this.event, this.context);
      case ERROR:
      case EXHAUSTED:
      default:
        return this.handleUnexpectedError(`Error when committing: ${r}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async handleUnexpectedError(err: any) {
    this.commitRetries = 0;
    console.log(`An unexpected error occurred: ${typeof err}`, err);
    console.log(`Context`, this.context);
    console.log(`Event`, this.event);
    if (err instanceof ConnectionAcquireTimeoutError) {
      console.log(`ConnectionAcquireTimeoutError, will try to rollback and retry`);
      try {
        await this.transaction.rollback();
      } catch (e) {
        console.log('Error when rolling back', e);
      }

      if (this.dbConnTimeoutErrors < this.maxDbConnTimeoutErrors) {
        this.dbConnTimeoutErrors++;
        console.log(`Retry connection #${this.dbConnTimeoutErrors}...`);
        await this.renewConn();
        await new Promise(
          (
            r // wait some before retrying
          ) => setTimeout(r, (this.dbConnTimeoutErrors + Math.random()) * 100)
        );
        return this.execute(this.event, this.context);
      }

      console.log(
        `Max connection retries ${this.maxDbConnTimeoutErrors} exhausted`
      );
    } else {
      this.dbConnTimeoutErrors = 0;
    }
    return this.serverError(this.context);
  }
}
