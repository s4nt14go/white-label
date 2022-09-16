import { BaseError } from './AppError';
import { Created } from './Created';
import { BaseTransaction } from './BaseTransaction';

export type ControllerResult<T> = {status: number, result?: T | BaseError | Created};
export type ControllerResultAsync<T> = Promise<ControllerResult<T>>

export abstract class BaseController<T, EventT> extends BaseTransaction {
  protected abstract executeImpl(
    dto: unknown | EventT
  ): ControllerResultAsync<T>;
}

