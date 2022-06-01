import { BaseError } from './AppError';

export class Result<T> {
  public isSuccess: boolean;
  public isFailure: boolean
  public error?: T | null | BaseError;
  private _value?: T;

  public constructor (isSuccess: boolean, error?: T | null | BaseError, value?: T) {
    if (isSuccess && error) {
      throw new Error("InvalidOperation: A result cannot be successful and contain an error");
    }
    if (!isSuccess && !error) {
      throw new Error("InvalidOperation: A failing result needs to contain an error message");
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this._value = value;

    Object.freeze(this);
  }

  public getValue () : T | undefined {
    if (!this.isSuccess) {
      console.log(this.error,);
      throw new Error("Can't get the value of an error result. Use 'errorValue' instead.")
    }

    return this._value;
  }

  public errorValue (): T {
    return this.error as T;
  }

  public static ok<U> (value?: U) : Result<U> {
    return new Result<U>(true, null, value);
  }

  public static fail (error: BaseError): Result<null> {
    return new Result<null>(false, error);
  }

  public static combine (results: Result<any>[]) : Result<any> {
    for (const result of results) {
      if (result.isFailure) return result;
    }
    return Result.ok();
  }
}