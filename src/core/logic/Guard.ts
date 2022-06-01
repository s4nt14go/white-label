import { BaseError } from './AppError';

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
  public static combine (guardResults: IGuardResult[]): IGuardResult {
    for (let result of guardResults) {
      if (!result.succeeded) return result;
    }

    return { succeeded: true };
  }

  public static againstAtLeast(numChars: number, text: string, error: BaseError): IGuardResult {
    return text.length >= numChars
        ? { succeeded: true }
        : { succeeded: false, error }
  }

  public static againstAtMost (numChars: number, text: string, error: BaseError): IGuardResult {
    return text.length <= numChars
        ? { succeeded: true }
        : { succeeded: false, error }
  }

  public static againstNullOrUndefined (value: any, error: BaseError): IGuardResult {
    if (value === null || value === undefined) {
      return { succeeded: false, error }
    } else {
      return { succeeded: true }
    }
  }

  public static againstNullOrUndefinedBulk(args: GuardArgumentCollection): IGuardResult {
    for (let arg of args) {
      const result = this.againstNullOrUndefined(arg.value, arg.error);
      if (!result.succeeded) return result;
    }

    return { succeeded: true }
  }

  public static isType (value: any, type: string, error: BaseError) : IGuardResult {
    if (typeof value === type) {
      return { succeeded: true }
    } else {
      return { succeeded: false, error}
    }
  }
}