import { ValueObject } from '../../../shared/domain/ValueObject';
import { Result } from '../../../shared/core/Result';
import { Guard } from '../../../shared/core/Guard';
import { DescriptionErrors } from './DescriptionErrors';
import { BaseError } from '../../../shared/core/AppError';

interface DescriptionProps {
  value: string;
}

export class Description extends ValueObject<DescriptionProps> {
  public static maxLength = 255;
  public static minLength = 3;

  get value(): string {
    return this.props.value;
  }

  private constructor(props: DescriptionProps) {
    super(props);
  }

  public static create(props: DescriptionProps): Result<Description> {
    const guardNull = Guard.againstNullOrUndefined(
      props.value,
      new DescriptionErrors.NotDefined()
    );
    const guardType = Guard.isType(
      props.value,
      'string',
      new DescriptionErrors.NotString()
    );
    const combined = Guard.combine([guardNull, guardType]);
    if (combined.isFailure) return Result.fail(combined.error as BaseError);

    const trimmed = props.value.trim().replace(/\s\s+/g, ' ');

    const { length } = trimmed;
    if (length < this.minLength)
      return Result.fail(new DescriptionErrors.TooShort(this.minLength, length));

    if (length > this.maxLength)
      return Result.fail(new DescriptionErrors.TooLong(this.maxLength, length));

    return Result.ok<Description>(new Description({ value: trimmed }));
  }
}
