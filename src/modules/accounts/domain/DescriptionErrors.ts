import { patch } from '../../../shared/core/utils';
import { BaseError } from '../../../shared/core/AppError';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace DescriptionErrors {
  export class NotDefined extends BaseError {
    public constructor() {
      super(`Description isn't defined`);
    }
  }

  export class NotString extends BaseError {
    public constructor() {
      super(`Description isn't a string`);
    }
  }

  export class TooShort extends BaseError {
    public constructor(minLength: number, currLength: number) {
      super(
        `Description should have at least ${minLength} characters long while this has ${currLength}`
      );
    }
  }

  export class TooLong extends BaseError {
    public constructor(maxLength: number, currLength: number) {
      super(
        `Description should have at most ${maxLength} characters long while this has ${currLength}`
      );
    }
  }

  export class InvalidCharacters extends BaseError {
    public constructor(chars: string[]) {
      super(`Description characters detected: ${chars.join(' ')}`);
    }
  }
}

patch({ DescriptionErrors });
