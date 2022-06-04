import { BaseError } from './AppError';
import { Result } from './Result';

export interface IGuardResult {
  succeeded: boolean;
  error?: any;
}

export interface IGuardArgument {
  value: any;
  error: BaseError;
}

export type GuardArgumentCollection = IGuardArgument[];

export class Guard {
  public static combine (guardResults: Result<any>[]): Result<any> {
    for (let result of guardResults) {
      if (result.isFailure) return result;
    }

    return guardResults[0];
  }

  public static againstAtLeast(numChars: number, text: string, error: BaseError): Result<any> {
    return text.length >= numChars
        ? Result.ok()
        : Result.fail(error)
  }

  public static againstNullOrUndefined (value: any, error: BaseError): Result<any> {
    if (value === null || value === undefined) {
      return Result.fail(error)
    } else {
      return Result.ok()
    }
  }

  public static againstNullOrUndefinedBulk(args: GuardArgumentCollection): Result<any> {
    for (let arg of args) {
      const result = this.againstNullOrUndefined(arg.value, arg.error);
      if (result.isFailure) return result;
    }

    return Result.ok()
  }

  public static isType (value: any, type: string, error: BaseError) : /*IGuardResult | */Result<any> {
    if (typeof value === type) {
      return Result.ok()
    } else {
      return Result.fail(error)
    }
  }
}