import { ValueObject } from '../../../shared/domain/ValueObject';
import { Result } from '../../../shared/core/Result';
import { Guard } from '../../../shared/core/Guard';
import { AmountErrors } from './AmountErrors';
import { BaseError } from '../../../shared/core/AppError';

interface AmountProps {
  value: number;
}

enum Operation {
  SUM = 'SUM',
  SUBTRACT = 'SUBTRACT',
}

export class Amount extends ValueObject<AmountProps> {

  // The operations add and subtract first multiply numbers by 100 to work with integers instead of decimals, and as it has no sense to allow a value we won't be able to add or subtract we set a maximum value for the creation:
  public static MAX_ABS = 90071992547409 // JS Number.MAX_SAFE_INTEGER = 9007199254740991, Number.MIN_SAFE_INTEGER = -9007199254740991

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

    // Unsigned integer part
    const integerAbsPart = Math.trunc(Math.abs(props.value));
    if (integerAbsPart > Amount.MAX_ABS)
      return Result.fail(new AmountErrors.MaxBreached(props.value));

    //#region round unsigned integer part to 2 decimal precision number
    // using "const rounded = Math.round(props.value * 100) / 100;" fails rounding 10.075 into 10.07 instead of 10.08, so do this:
    let rounded = integerAbsPart;

    const decimalStr = props.value.toString().split('.')[1];
    if (decimalStr) {
      let str3 = decimalStr.substring(0, 3); // e.g. '10.0759' to '075'
      str3 = str3.padEnd(3, '0'); // e.g. '10.1' to '100'; '10.01' to '010'
      const XXO = str3.at(2); // e.g. '123' to '3'

      let num3 = Number(str3);
      if (Number(XXO) >= 5) {
        num3 += 10;
      }
      const num2 = Math.trunc(num3 / 10);

      if (num2 === 100) {
        rounded += 1;
      } else {
        const num2_str = num2.toString().padStart(2, '0');
        rounded = Number(rounded + '.' + num2_str);
      }
    }
    //#endregion

    const sign = props.value < 0 ? -1 : 1;

    return Result.ok<Amount>(new Amount({ value: rounded * sign }));
  }

  private operation(amount: Amount, type: Operation): Result<Amount> {
    console.log(`operation: ${type}`);
    console.log('this.props.value', this.props.value);
    console.log('amount.value', amount.value);
    const thisx100 = Amount.multiplyBy100(this.props.value);
    const operandx100 = Amount.multiplyBy100(amount.value);
    let resultx100;
    switch (type) {
      case Operation.SUM:
        resultx100 = thisx100 + operandx100;
        break;
      case Operation.SUBTRACT:
        resultx100 = thisx100 - operandx100;
        break;
      default:
        throw Error(`Operation unknown: ${type}`);
    }

    const resultOrError = Amount.create({ value: Amount.divideBy100(resultx100) });

    if (resultOrError.isFailure)
      return Result.fail(new AmountErrors.InvalidOperationResult(resultOrError.error as BaseError));

    const result = resultOrError.value;
    console.log('operation result', result);
    return Result.ok(result);
  }

  public subtract(amount: Amount): Result<Amount> {
    return this.operation(amount, Operation.SUBTRACT);
  }

  public add(amount: Amount): Result<Amount> {
    return this.operation(amount, Operation.SUM);
  }

  public negate(): Amount {
    return Amount.create({ value: -this.props.value }).value;
  }

  private static multiplyBy100(value: number): number {
    const arrayStr = value.toString().split('');
    let integerPart, decimalPart;
    const dotIndex = arrayStr.indexOf('.');
    if (dotIndex === -1) {
      integerPart = value;
      decimalPart = '00';
    } else {
      decimalPart = arrayStr.slice(dotIndex + 1).join('');
      decimalPart = decimalPart.padEnd(2, '0');
      integerPart = arrayStr.slice(0,dotIndex).join('');
    }
    return Number(integerPart + decimalPart);
  }
  private static divideBy100(value: number): number {
    const arrayStr = value.toString().split('');
    if (arrayStr.includes('.')) throw Error(`divideBy100 only handles integer numbers`);
    const decimalPart = arrayStr.slice(-2).join('');
    const integerPart = arrayStr.slice(0,-2).join('');
    return Number(integerPart + '.' + decimalPart);
  }
}
