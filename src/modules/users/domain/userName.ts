
import { ValueObject } from "../../../core/domain/ValueObject";
import { Result } from "../../../core/logic/Result";
import { Guard } from "../../../core/logic/Guard";
import { CreateNameErrors } from './userNameErrors';

interface UserNameProps {
  name: string;
}

export class UserName extends ValueObject<UserNameProps> {
  public static maxLength: number = 15;
  public static minLength: number = 2;

  get value (): string {
    return this.props.name;
  }

  private constructor (props: UserNameProps) {
    super(props);
  }

  public static create (props: UserNameProps): Result<UserName | null> {
    const guardNulls = Guard.againstNullOrUndefined(props.name, new CreateNameErrors.NameNotDefined());
    const guardType = Guard.isType(props.name, 'string', new CreateNameErrors.NameNotString());
    const combined = Guard.combine([guardNulls, guardType]);
    if (!combined.succeeded) return Result.fail(combined.error);

    const trimmed = props.name.trim();
    const minLengthResult = Guard.againstAtLeast(this.minLength, trimmed, new CreateNameErrors.TooShort(this.minLength));
    if (!minLengthResult.succeeded) {
      return Result.fail(minLengthResult.error)
    }

    const maxLengthResult = Guard.againstAtMost(this.maxLength, trimmed, new CreateNameErrors.TooLong(this.maxLength));
    if (!maxLengthResult.succeeded) {
      return Result.fail(maxLengthResult.error)
    }

    return Result.ok<UserName>(new UserName({ name: trimmed }));
  }
}