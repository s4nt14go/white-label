import { patch } from '../../../shared/core/utils';
import { BaseError } from '../../../shared/core/AppError';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AmountErrors {
  export class NotDefined extends BaseError {
    public constructor() {
      super(`Amount isn't defined`);
    }
  }

  export class NotNumber extends BaseError {
    public constructor() {
      super(`Amount isn't a number`);
    }
  }

  export class MaxBreached extends BaseError {
    public constructor(value: number) {
      super(`Number ${value} is too big to be handled with 2 decimal precision`);
    }
  }

  export class InvalidOperationResult extends BaseError {
    public constructor(error: BaseError) {
      super(`Invalid operation result: ${error.message} [${error.type}]`);
    }
  }
}

patch({ AmountErrors });
