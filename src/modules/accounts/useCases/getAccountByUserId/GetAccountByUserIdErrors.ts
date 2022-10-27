import { BaseError } from '../../../../shared/core/AppError';
import { patch } from '../../../../shared/core/utils';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace GetAccountByUserIdErrors {
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
}

patch({ GetAccountByUserIdErrors });
