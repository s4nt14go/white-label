import { patch } from '../../../shared/core/utils';
import { BaseError } from '../../../shared/core/AppError';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AccountErrors {

  export class NoTransactions extends BaseError {
    public constructor() {
      super(`Accounts should have at least one transaction`);
    }
  }

  export class InvalidTransaction extends BaseError {
    public constructor(error: BaseError) {
      super(`Invalid transaction: ${error.message} [${error.type}]`);
    }
  }

  // Transfer errors:
  export class InvalidFromTransaction extends BaseError {
    public constructor(error: BaseError) {
      super(`Source/from transaction is invalid: ${error.message} [${error.type}]`);
    }
  }
  export class InvalidToTransaction extends BaseError {
    public constructor(error: BaseError) {
      super(`Destination/to transaction is invalid: ${error.message} [${error.type}]`);
    }
  }
}

patch({ AccountErrors });
