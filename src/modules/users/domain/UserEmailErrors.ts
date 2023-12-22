import { patch } from '../../../shared/core/utils';
import { BaseError } from '../../../shared/core/AppError';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CreateEmailErrors {
  export class EmailNotValid extends BaseError {
    public constructor() {
      super(`Email isn't valid`);
    }
  }
}

patch({ CreateEmailErrors });
