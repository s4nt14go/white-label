import { BaseError, UnexpectedError } from './AppError';
import { Created } from './Created';
import { BaseTransaction } from './BaseTransaction';
import { Context } from 'aws-lambda';
import { ConnectionAcquireTimeoutError } from 'sequelize';
import { Envelope } from './Envelope';
import { DispatcherLambda } from '../infra/dispatchEvents/DispatcherLambda';
import { IDispatcher } from '../domain/events/DomainEvents';

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
> extends BaseTransaction<Request, ExeResponse> {
  protected abstract executeImpl(dto: unknown | Request): ControllerResultAsync<Response>;
  protected abstract execute(event: Request, context: Context): ExeResponse;
  protected abstract event: Request;
  protected abstract context: Context;
  private dbConnTimeoutErrors = 0;
  private maxDbConnTimeoutErrors = 3;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly renewConn?: any;
  protected dispatcher: IDispatcher;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected constructor(renewConn?: any, getTransaction?: any) {
    super(getTransaction);
    this.renewConn = renewConn;
    this.dispatcher = new DispatcherLambda();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async handleUnexpectedError(err: any) {
    this.commitRetries = 0;
    console.log(`An unexpected error occurred:  type ${typeof err} name ${err.name} code ${err.code}`, err);
    console.log(`Context`, this.context);
    console.log(`Event`, this.event);
    if (err instanceof ConnectionAcquireTimeoutError || err.code === '40001' || err.name.includes('Database')) {
      console.log(`Database error, will try to rollback and retry`);
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
        return this.dispatcher.dispatch(this.event as never, this.context.functionName);
      }

      console.log(
        `Max connection retries ${this.maxDbConnTimeoutErrors} exhausted`
      );
    } else {
      this.dbConnTimeoutErrors = 0;
    }
    return this.serverError(this.context);
  }

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
}
