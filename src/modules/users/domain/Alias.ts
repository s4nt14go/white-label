import { ValueObject } from '../../../shared/domain/ValueObject';
import { Result } from '../../../shared/core/Result';
import { Guard } from '../../../shared/core/Guard';
import { AliasErrors } from './AliasErrors';
import { BaseError } from '../../../shared/core/AppError';

interface AliasProps {
  value: string | null;
}

interface AliasInput {
  value?: string | null;
}

export class Alias extends ValueObject<AliasProps> {
  public static maxLength = 15;
  public static minLength = 2;

  get value(): string | null {
    return this.props.value;
  }

  private constructor(props: AliasProps) {
    super(props);
  }

  public static create(props: AliasInput): Result<Alias> {
    if (
      props.value === null ||
      props.value === undefined ||
      (typeof props.value === 'string' && props.value.trim() === '')
    )
      return Result.ok<Alias>(new Alias({ value: null }));
    const guardType = Guard.isType(
      props.value,
      'string',
      new AliasErrors.AliasNotString()
    );
    if (guardType.isFailure) return Result.fail(guardType.error as BaseError);

    const trimmed = props.value.trim();
    const invalidChars = trimmed.match(/[^a-z0-9.\-_+]/gi);
    if (invalidChars)
      return Result.fail(new AliasErrors.InvalidCharacters(invalidChars));
    return Result.convertValue(trimmed)
      .ensure((value: string) => {
        return value.length >= this.minLength;
      }, new AliasErrors.TooShort(this.minLength))
      .ensure((value: string) => {
        return value.length <= this.maxLength;
      }, new AliasErrors.TooLong(this.maxLength))
      .onBoth((result) =>
        result.isSuccess
          ? Result.ok<Alias>(new Alias({ value: result.value }))
          : Result.fail(result.error as BaseError)
      );
  }
}
