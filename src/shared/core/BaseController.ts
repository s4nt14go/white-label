import { BaseError } from './AppError';
import { Created } from './Created';
import { BaseTransaction } from './BaseTransaction';
import { Context } from 'aws-lambda';

export type ControllerResult<T> = {
  status: number;
  result?: T | BaseError | Created;
};
export type ControllerResultAsync<T> = Promise<ControllerResult<T>>;

export abstract class BaseController<T, EventT> extends BaseTransaction {
  protected abstract executeImpl(dto: unknown | EventT): ControllerResultAsync<T>;
  protected abstract event: EventT;
  protected abstract context: Context;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected abstract serverError(context: Context): any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected handleUnexpectedError(err: any) {
    this.dbRetries = 0;
    console.log(`An unexpected error occurred`, err);
    console.log(`Context`, this.context);
    console.log(`Event`, this.event);
    return this.serverError(this.context);
  }
}
