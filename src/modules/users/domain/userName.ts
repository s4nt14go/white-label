
import { ValueObject } from "../../../core/domain/ValueObject";
import { Result } from "../../../core/logic/Result";
import { Guard } from "../../../core/logic/Guard";
import { CreateNameErrors } from './userNameErrors';

interface UserNameProps {
  name: string;
}

export class UserName extends ValueObject<UserNameProps> {
  public static maxLength = 15;
  public static minLength = 2;

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
    if (combined.isFailure) return Result.fail(combined.error);

    const trimmed = props.name.trim();
    const invalidChars = trimmed.match(/[^a-z0-9.\-_+]/ig)
    if (invalidChars) return Result.fail(new CreateNameErrors.InvalidCharacters(invalidChars));
    return Result.convertValue(trimmed)
        .ensure((value: string) => { return value.length >= this.minLength}, new CreateNameErrors.TooShort(this.minLength))
        .ensure((value: string) => { return value.length <= this.maxLength}, new CreateNameErrors.TooLong(this.maxLength))
        .onBoth(result =>
            result.isSuccess?
                Result.ok<UserName>(new UserName({ name: result.value })) :
                Result.fail(result.error))
  }
}