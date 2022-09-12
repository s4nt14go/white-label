import { BaseError } from '../../../../shared/core/AppError';
import { patch } from '../../../../shared/core/utils';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TransferErrors {

  export class FromAccountNotFound extends BaseError {
    public constructor(userId: string) {
      super(`Source account with userId ${userId} wasn't found`);
    }
  }
  export class ToAccountNotFound extends BaseError {
    public constructor(userId: string) {
      super(`Destination account with userId ${userId} wasn't found`);
    }
  }

  export class QuantityInvalid extends BaseError {
    public constructor(error: BaseError) {
      super(`Quantity is invalid: ${error.message} [${error.type}]`);
    }
  }

  export class FromDescriptionInvalid extends BaseError {
    public constructor(error: BaseError) {
      super(`Description is invalid: ${error.message} [${error.type}]`);
    }
  }
  export class ToDescriptionInvalid extends BaseError {
    public constructor(error: BaseError) {
      super(`Destination/to description is invalid: ${error.message} [${error.type}]`);
    }
  }

  export class InvalidTransfer extends BaseError {
    public constructor(error: BaseError) {
      super(`Invalid transfer: ${error.message} [${error.type}]`);
    }
  }
}

patch({ TransferErrors });
