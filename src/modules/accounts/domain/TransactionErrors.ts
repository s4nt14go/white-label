import { patch } from '../../../shared/core/utils';
import { BaseError } from '../../../shared/core/AppError';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TransactionErrors {
  export class NegativeBalance extends BaseError {
    public constructor(negative: number) {
      super(`Transaction balance can't be negative: ${negative}`);
    }
  }
}

patch({ TransactionErrors });
