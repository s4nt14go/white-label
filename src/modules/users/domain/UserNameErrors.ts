import { patch } from '../../../shared/core/utils';
import { BaseError } from '../../../shared/core/AppError';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CreateNameErrors {
  export class NameNotDefined extends BaseError {
    public constructor() {
      super(`Name isn't defined`);
    }
  }

  export class NameNotString extends BaseError {
    public constructor() {
      super(`Name isn't a string`);
    }
  }

  export class TooShort extends BaseError {
    public constructor(minLength: number) {
      super(`Name should have at least ${minLength} characters long`);
    }
  }

  export class TooLong extends BaseError {
    public constructor(maxLength: number) {
      super(`Name should have at most ${maxLength} characters long`);
    }
  }

  export class InvalidCharacters extends BaseError {
    public constructor(chars: string[]) {
      super(`Invalid characters detected: ${chars.join(' ')}`);
    }
  }
}

patch({ CreateNameErrors });
