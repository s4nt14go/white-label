import { ValueObject } from '../../../shared/domain/ValueObject';
import { Result } from '../../../shared/core/Result';
import { Guard } from '../../../shared/core/Guard';
import { AmountErrors } from './AmountErrors';
import { BaseError } from '../../../shared/core/AppError';

interface AmountProps {
  value: number;
}

export class Amount extends ValueObject<AmountProps> {
  get value(): number {
    return this.props.value;
  }

  private constructor(props: AmountProps) {
    super(props);
  }

  public static create(props: AmountProps): Result<Amount> {
    const guardNull = Guard.againstNullOrUndefined(
      props.value,
      new AmountErrors.NotDefined()
    );
    const guardType = Guard.isType(
      props.value,
      'number',
      new AmountErrors.NotNumber()
    );
    const combined = Guard.combine([guardNull, guardType]);
    if (combined.isFailure) return Result.fail(combined.error as BaseError);

    const integer100 = Math.round((props.value + Number.EPSILON) * 100);

    if (Math.abs(integer100) > Number.MAX_SAFE_INTEGER)
      return Result.fail(new AmountErrors.MaxBreached(props.value));

    return Result.ok<Amount>(new Amount({ value: integer100 / 100 }));
  }

  public subtract(amount: Amount): Amount {
    console.log('subtracting this.props.value', this.props.value);
    console.log('amount.value', amount.value);
    const r = Amount.create({ value: this.props.value - amount.value }).value;
    console.log('r.value', r.value);
    return r;
  }

  public add(amount: Amount): Amount {
    console.log('adding this.props.value', this.props.value);
    console.log('amount.value', amount.value);
    const r = Amount.create({ value: this.props.value + amount.value }).value;
    console.log('r.value', r.value);
    return r;
  }

  public negate(): Amount {
    return Amount.create({ value: -this.props.value }).value;
  }
}
