export class BaseError {
  public readonly type: string;
  protected constructor(public readonly message: string) {
    this.type = this.constructor.name;
    this.message = message;
  }
}

export class UnexpectedError extends BaseError {
  public constructor() {
    super('An unexpected error occurred');
  }
}

export class MalformedRequest extends BaseError {
  public constructor() {
    super('Malformed request');
  }
}
