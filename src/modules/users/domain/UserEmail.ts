import { ValueObject } from '../../../shared/domain/ValueObject';
import { Result } from '../../../shared/core/Result';
import { CreateEmailErrors } from './UserEmailErrors';

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
    const trimmed = email.trim();
    const validEmail = /^\w+([.-\\+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(
      trimmed
    );
    if (!validEmail) return Result.fail(new CreateEmailErrors.EmailNotValid());

    return Result.ok<UserEmail>(new UserEmail({ value: trimmed }));
  }
}
