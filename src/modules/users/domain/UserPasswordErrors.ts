import { patch } from '../../../shared/core/utils';
import { BaseError } from '../../../shared/core/AppError';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CreatePasswordErrors {
  export class TooShort extends BaseError {
    public constructor(minLength: number) {
      super(`Password should have at least ${minLength}`);
    }
  }
}

patch({ CreatePasswordErrors });
