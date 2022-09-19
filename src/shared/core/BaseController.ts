import { BaseError } from './AppError';
import { Created } from './Created';
import { BaseTransaction } from './BaseTransaction';
import { Context } from 'aws-lambda';
import { ConnectionAcquireTimeoutError } from 'sequelize';

export type ControllerResult<T> = {
  status: number;
  result?: T | BaseError | Created;
};
export type ControllerResultAsync<T> = Promise<ControllerResult<T>>;

export abstract class BaseController<
  T,
  EventT,
  ResponseT
> extends BaseTransaction {
  protected abstract executeImpl(dto: unknown | EventT): ControllerResultAsync<T>;
  protected abstract execute(event: EventT, context: Context): ResponseT;
  protected abstract event: EventT;
  protected abstract context: Context;
  private dbConnTimeoutErrors = 0;
  private maxDbConnTimeoutErrors = 3;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected abstract serverError(context: Context): any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async handleUnexpectedError(err: any) {
    this.commitRetries = 0;
    console.log(`An unexpected error occurred`, err);
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
