import { ValueObject } from '../../../shared/domain/ValueObject';
import { Result } from '../../../shared/core/Result';
import { Guard } from '../../../shared/core/Guard';
import { AmountErrors } from './AmountErrors';

interface AmountProps {
  value: number;
}

interface AmountInput {
  value: number;
}

export class Amount extends ValueObject<AmountProps> {
  get value(): number {
    return this.props.value;
  }

  private constructor(props: AmountProps) {
    super(props);
  }

  static create(props: AmountInput): Result<Amount> {
    const guardNull = Guard.againstNullOrUndefined(props.value, new AmountErrors.NotDefined());
    const guardType = Guard.isType(
      props.value,
      'number',
      new AmountErrors.NotNumber()
    );
    const combined = Guard.combine([guardNull, guardType]);
    if (combined.isFailure) return Result.fail(combined.error);

    const rounded = Math.round(props.value * 100) / 100;

    return Result.ok<Amount>(new Amount({ value: rounded }));
  }
}
