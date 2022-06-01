import { BaseError } from '../../../../core/logic/AppError';
import { patch } from '../../../../core/infra/utils';

export namespace CreateUserErrors {

  export class EmailAlreadyTaken extends BaseError {
    constructor (email: string) {
      super(`The email ${email} is already taken`)
    }
  }

  export class UsernameAlreadyTaken extends BaseError {
    constructor (username: string) {
      super(`The username ${username} is already taken`)
    }
  }

}

patch({ CreateUserErrors });