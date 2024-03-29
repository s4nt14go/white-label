import { patch } from '../../../shared/core/utils';
import { BaseError } from '../../../shared/core/AppError';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AliasErrors {

  export class TooShort extends BaseError {
    public constructor(minLength: number) {
      super(`Alias should have at least ${minLength} characters long`);
    }
  }

  export class TooLong extends BaseError {
    public constructor(maxLength: number) {
      super(`Alias should have at most ${maxLength} characters long`);
    }
  }

  export class InvalidCharacters extends BaseError {
    public constructor(chars: string[]) {
      super(`Invalid characters detected: ${chars.join(' ')}`);
    }
  }
}

patch({ AliasErrors });
