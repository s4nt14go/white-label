import { patch } from '../../../core/infra/utils';
import { BaseError } from '../../../core/logic/AppError';

export namespace CreateEmailErrors {  // eslint-disable-line @typescript-eslint/no-namespace

  export class EmailNotDefined extends BaseError {
    constructor () {
      super('Email is not defined')
    }
  }

  export class EmailNotString extends BaseError {
    constructor () {
      super('Email should be a string')
    }
  }

  export class EmailNotValid extends BaseError {
    constructor () {
      super(`Email isn't valid`)
    }
  }

}

patch({ CreateEmailErrors });