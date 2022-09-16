import { ValueObject } from '../../../shared/domain/ValueObject';
import { Result } from '../../../shared/core/Result';
import { Guard } from '../../../shared/core/Guard';
import { CreateEmailErrors } from './UserEmailErrors';
import { BaseError } from '../../../shared/core/AppError';

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
    if (combined.isFailure) return Result.fail(combined.error as BaseError);

    const trimmed = email.trim();
    const validEmail = /^\w+([.-\\+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(
      trimmed
    );
    if (!validEmail) return Result.fail(new CreateEmailErrors.EmailNotValid());

    return Result.ok<UserEmail>(new UserEmail({ value: trimmed }));
  }
}
