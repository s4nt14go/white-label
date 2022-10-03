import { BaseError } from './AppError';

export class Result<T> {
  public isSuccess: boolean;
  public isFailure: boolean;
  public error?: null | BaseError;
  private readonly _value?: T;

  public constructor(isSuccess: boolean, error?: null | BaseError, value?: T) {
    if (isSuccess && error) {
      throw new Error(
        'InvalidOperation: A result cannot be successful and contain an error'
      );
    }
    if (!isSuccess && !error) {
      throw new Error(
        'InvalidOperation: A failing result needs to contain an error message'
      );
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this._value = value;

    Object.freeze(this);
  }

  get value(): T {
    if (!this.isSuccess) {
      console.log('this:', this);
      throw new Error("Can't get value when Result didn't succeeded.");
    }
    if (this._value === undefined) {
      console.log('this:', this);
      throw new Error(`Can't get value when Result._value is undefined.`);
    }
    return this._value;
  }

  public static ok<T>(value?: T): Result<T> {
    return new Result<T>(true, null, value);
  }

  public static convertValue<T>(value: T): Result<T> {
    return new Result<T>(true, null, value);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static fail(error: BaseError): Result<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Result<any>(false, error);
  }

  public static combine(results: Result<unknown>[]): Result<unknown> {
    for (const result of results) {
      if (result.isFailure) return result;
    }
    return Result.ok();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public ensure(func: (v: T) => boolean, error: BaseError): Result<any> {
    if (this.isFailure) return this;
    if (this._value === undefined)
      throw new Error('Case Result without value not implemented in ensure');
    if (!func(this._value)) return Result.fail(error);
    return this;
  }

  public onBoth(func: (v: this) => Result<T>): Result<T> {
    return func(this);
  }
}
