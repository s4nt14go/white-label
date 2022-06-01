export class BaseError {
  readonly type: string
  protected constructor (readonly message: string) {
    this.type = this.constructor.name
    this.message = message
  }
}

export class UnexpectedError extends BaseError {
  constructor () {
    super('An unexpected error occurred')
  }
}