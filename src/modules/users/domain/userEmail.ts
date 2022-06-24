import { ValueObject } from '../../../core/domain/ValueObject';
import { Result } from '../../../core/logic/Result';
import { Guard } from '../../../core/logic/Guard';
import { CreateEmailErrors } from './userEmailErrors';

interface UserEmailProps {
  value: string;
}

export class UserEmail extends ValueObject<UserEmailProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: UserEmailProps) {
    super(props);
  }

  public static create(email: string): Result<UserEmail> {
    const guardNulls = Guard.againstNullOrUndefined(
      email,
      new CreateEmailErrors.EmailNotDefined()
    );
    const guardType = Guard.isType(
      email,
      'string',
      new CreateEmailErrors.EmailNotString()
    );
    const combined = Guard.combine([guardNulls, guardType]);
    if (combined.isFailure) return Result.fail(combined.error);

    const trimmed = email.trim();
    const validEmail = /^\w+([.-\\+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(
      trimmed
    );
    if (!validEmail) return Result.fail(new CreateEmailErrors.EmailNotValid());

    return Result.ok<UserEmail>(new UserEmail({ value: trimmed }));
  }
}
