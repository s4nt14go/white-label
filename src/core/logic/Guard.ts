import { BaseError } from './AppError';
import { Result } from './Result';

export interface IGuardResult {
  succeeded: boolean;
  error?: unknown;
}

export interface IGuardArgument {
  value: unknown;
  error: BaseError;
}

export type GuardArgumentCollection = IGuardArgument[];

export class Guard {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static combine(guardResults: Result<any>[]): Result<any> {
    for (const result of guardResults) {
      if (result.isFailure) return result;
    }

    return guardResults[0];
  }

  public static againstAtLeast(
    numChars: number,
    text: string,
    error: BaseError
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Result<any> {
    return text.length >= numChars ? Result.ok() : Result.fail(error);
  }

  public static againstNullOrUndefined(
    value: unknown,
    error: BaseError
  ): Result<unknown> {
    if (value === null || value === undefined) {
      return Result.fail(error);
    } else {
      return Result.ok();
    }
  }

  public static againstNullOrUndefinedBulk(
    args: GuardArgumentCollection
  ): Result<unknown> {
    for (const arg of args) {
      const result = this.againstNullOrUndefined(arg.value, arg.error);
      if (result.isFailure) return result;
    }

    return Result.ok();
  }

  public static isType(
    value: unknown,
    type: string,
    error: BaseError
  ): Result<unknown> {
    if (typeof value === type) {
      return Result.ok();
    } else {
      return Result.fail(error);
    }
  }
}
