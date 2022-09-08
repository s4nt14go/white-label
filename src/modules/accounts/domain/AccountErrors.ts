import { patch } from '../../../shared/core/utils';
import { BaseError } from '../../../shared/core/AppError';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AccountErrors {

  export class NoTransactions extends BaseError {
    public constructor() {
      super(`Accounts should have at least one transaction`);
    }
  }
}

patch({ AccountErrors });
