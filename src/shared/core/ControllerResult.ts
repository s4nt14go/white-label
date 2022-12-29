import { BaseError } from './AppError';
import { Created } from './Created';

type _ControllerResult<T> = {
  status: number;
  result?: T | BaseError | Created;
};
export type ControllerResult<T> = Promise<_ControllerResult<T>>;