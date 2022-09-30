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

    const integerPart = Math.trunc(props.value);
    if (Math.abs(integerPart) + 1 > Number.MAX_SAFE_INTEGER)
      return Result.fail(new AmountErrors.MaxBreached(props.value));

    //#region round to 2 decimal precision number
    let rounded = integerPart;

    const decimalStr = props.value.toString().split('.')[1];
    if (decimalStr) {
      let str3 = decimalStr.substring(0, 3);  // e.g. '10.0759' to '075'
      str3 = str3.padEnd(3, '0');             // e.g. '10.1' to '100'; '10.01' to '010'
      const XXO = str3.at(2);           // e.g. '123' to '3'

      let num3 = Number(str3);
      if (Number(XXO) >= 5) {
        num3 += 10;
      }
      const num2 = Math.trunc(num3/10);

      if (num2 > 100) {
        rounded += 1;
      } else {
        const num2_str = num2.toString().padStart(2, '0')
        rounded = Number(rounded + '.' + num2_str);
      }
    }
    //#endregion

    return Result.ok<Amount>(new Amount({ value: rounded }));
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
