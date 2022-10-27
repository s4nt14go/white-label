import { BaseError } from '../../../../shared/core/AppError';
import { patch } from '../../../../shared/core/utils';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CreateTransactionErrors {
  export class UserIdNotDefined extends BaseError {
    public constructor() {
      super(`Provide userId`);
    }
  }
  export class UserIdNotString extends BaseError {
    public constructor(type: string) {
      super(`UserId should be a string instead of ${type}`);
    }
  }
  export class UserIdNotUuid extends BaseError {
    public constructor(userId: string) {
      super(`User id ${userId} isn't a valid UUID`);
    }
  }

  export class AccountNotFound extends BaseError {
    public constructor(userId: string) {
      super(`Account with userId ${userId} wasn't found`);
    }
  }

  export class InvalidDelta extends BaseError {
    public constructor(error: BaseError) {
      super(`Delta is invalid: ${error.message} [${error.type}]`);
    }
  }

  export class InvalidDescription extends BaseError {
    public constructor(error: BaseError) {
      super(`Description is invalid: ${error.message} [${error.type}]`);
    }
  }

  export class InvalidTransaction extends BaseError {
    public constructor(error: BaseError) {
      super(`Invalid transaction: ${error.message} [${error.type}]`);
    }
  }
}

patch({ CreateTransactionErrors });
