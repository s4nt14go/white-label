import { patch } from '../../../core/infra/utils';
import { BaseError } from '../../../core/logic/AppError';

export namespace CreateNameErrors {

  export class NameNotDefined extends BaseError {
    constructor () {
      super(`Name isn't defined`)
    }
  }

  export class NameNotString extends BaseError {
    constructor () {
      super(`Name isn't a string`)
    }
  }

  export class TooShort extends BaseError {
    constructor (minLength: number) {
      super(`Name should have at least ${minLength}`)
    }
  }

  export class TooLong extends BaseError {
    constructor (maxLength: number) {
      super(`Name should have at most ${maxLength}`)
    }
  }

  export class InvalidCharacters extends BaseError {
    constructor (chars: string[]) {
      super(`Invalid characters detected: ${chars.join(' ')}`)
    }
  }

}

patch({ CreateNameErrors });