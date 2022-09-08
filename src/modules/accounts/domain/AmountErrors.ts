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
}

patch({ AmountErrors });
