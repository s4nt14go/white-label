import { BaseError } from '../../../../shared/core/AppError';
import { patch } from '../../../../shared/core/utils';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CreateUserErrors {
  export class EmailAlreadyTaken extends BaseError {
    public constructor(email: string) {
      super(`The email ${email} is already taken`);
    }
  }

  export class UsernameAlreadyTaken extends BaseError {
    public constructor(username: string) {
      super(`The username ${username} is already taken`);
    }
  }
}

patch({ CreateUserErrors });
