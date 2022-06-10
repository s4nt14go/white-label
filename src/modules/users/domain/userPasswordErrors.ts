import { patch } from '../../../core/infra/utils';
import { BaseError } from '../../../core/logic/AppError';

export namespace CreatePasswordErrors { // eslint-disable-line @typescript-eslint/no-namespace

  export class PasswordNotDefined extends BaseError {
    constructor () {
      super(`Password isn't defined`)
    }
  }

  export class PasswordNotString extends BaseError {
    constructor () {
      super(`Password isn't a string`)
    }
  }

  export class TooShort extends BaseError {
    constructor (minLength: number) {
      super(`Password should have at least ${minLength}`)
    }
  }

}

patch({ CreatePasswordErrors });