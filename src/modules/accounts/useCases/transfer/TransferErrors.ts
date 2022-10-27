import { BaseError } from '../../../../shared/core/AppError';
import { patch } from '../../../../shared/core/utils';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TransferErrors {
  export class FromUserIdNotDefined extends BaseError {
    public constructor() {
      super(`Provide source/from account's userId`);
    }
  }
  export class ToUserIdNotDefined extends BaseError {
    public constructor() {
      super(`Provide destination/to account's userId`);
    }
  }
  export class FromUserIdNotString extends BaseError {
    public constructor(type: string) {
      super(`Source/from account's userId should be a string instead of ${type}`);
    }
  }
  export class ToUserIdNotString extends BaseError {
    public constructor(type: string) {
      super(
        `Destination/to account's userId should be a string instead of ${type}`
      );
    }
  }
  export class UserIdNotUuid extends BaseError {
    public constructor(userId: string) {
      super(`User id ${userId} isn't a valid UUID`);
    }
  }

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
      super(
        `Destination/to description is invalid: ${error.message} [${error.type}]`
      );
    }
  }

  export class SameFromAndTo extends BaseError {
    public constructor(userId: string) {
      super(
        `Source/from and destination/to accounts can't be the same: ${userId}`
      );
    }
  }

  export class InvalidTransfer extends BaseError {
    public constructor(error: BaseError) {
      super(`Invalid transfer: ${error.message} [${error.type}]`);
    }
  }
}

patch({ TransferErrors });
