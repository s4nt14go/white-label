import { ValueObject } from '../../../shared/domain/ValueObject';
import { Result } from '../../../shared/core/Result';
import { CreateNameErrors } from './UserNameErrors';
import { BaseError } from '../../../shared/core/AppError';

interface UserNameProps {
  name: string;
}

export class UserName extends ValueObject<UserNameProps> {
  public static maxLength = 15;
  public static minLength = 2;

  get value(): string {
    return this.props.name;
  }

  private constructor(props: UserNameProps) {
    super(props);
  }

  public static create(props: UserNameProps): Result<UserName> {
    const trimmed = props.name.trim();
    const invalidChars = trimmed.match(/[^a-z0-9.\-_+]/gi);
    if (invalidChars)
      return Result.fail(new CreateNameErrors.InvalidCharacters(invalidChars));
    return Result.convertValue(trimmed)
      .ensure((value: string) => {
        return value.length >= this.minLength;
      }, new CreateNameErrors.TooShort(this.minLength))
      .ensure((value: string) => {
        return value.length <= this.maxLength;
      }, new CreateNameErrors.TooLong(this.maxLength))
      .onBoth((result) =>
        result.isSuccess
          ? Result.ok<UserName>(new UserName({ name: result.value }))
          : Result.fail(result.error as BaseError)
      );
  }
}
