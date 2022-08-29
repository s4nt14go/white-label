import { patch } from '../../../shared/core/utils';
import { BaseError } from '../../../shared/core/AppError';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CreateEmailErrors {
  export class EmailNotDefined extends BaseError {
    constructor() {
      super('Email is not defined');
    }
  }

  export class EmailNotString extends BaseError {
    constructor() {
      super('Email should be a string');
    }
  }

  export class EmailNotValid extends BaseError {
    constructor() {
      super(`Email isn't valid`);
    }
  }
}

patch({ CreateEmailErrors });
