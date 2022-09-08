import { BaseError } from './AppError';

export class Envelope<T> {
  public readonly result?: T;
  public readonly errorMessage?: string;
  public readonly errorType?: string;
  public readonly time: string;

  public constructor(result?: T, error?: BaseError) {
    if (result !== undefined) this.result = result;
    if (error !== undefined) {
      this.errorMessage = error.message;
      this.errorType = error.type;
    }
    this.time = new Date().toJSON();

    Object.freeze(this);
  }

  public static ok<U>(result?: U): Envelope<U> {
    return new Envelope<U>(result);
  }

  public static error<U>(error: BaseError): Envelope<U> {
    return new Envelope<U>(undefined, error);
  }
}
