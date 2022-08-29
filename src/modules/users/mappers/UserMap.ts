import { User } from '../domain/User';
import { UniqueEntityID } from '../../../shared/domain/UniqueEntityID';
import { UserEmail } from '../domain/UserEmail';
import { UserPassword } from '../domain/UserPassword';
import { UserName } from '../domain/UserName';
import { Alias } from '../domain/Alias';
import { Result } from '../../../shared/core/Result';

export class UserMap {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static async toPersistence(user: User): Promise<any> {
    const { isDeleted, isEmailVerified, isAdminUser } = user.props;
    return {
      id: user.id.toString(),
      username: user.username.value,
      email: user.email.value,
      password: await user.password.getHashedValue(),
      alias: user.alias.value,
      is_deleted: isDeleted,
      is_email_verified: isEmailVerified,
      is_admin_user: isAdminUser,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static toDomain(raw: any): User {
    const emailOrError = UserEmail.create(raw.email);
    const passwordOrError = UserPassword.create({ value: raw.password });
    const usernameOrError = UserName.create({ name: raw.username });
    const aliasOrError = Alias.create({ value: raw.alias });

    const dtoResult = Result.combine([
      emailOrError,
      passwordOrError,
      usernameOrError,
      aliasOrError,
    ]);

    if (dtoResult.isFailure) {
      console.log('raw:', raw);
      console.log('dtoResult:', dtoResult);
      throw new Error(`User couldn't be reconstructed from DB`);
    }
    const email = emailOrError.value;
    const password = passwordOrError.value;
    const username = usernameOrError.value;
    const alias = aliasOrError.value;

    const {
      is_email_verified: isEmailVerified,
      is_admin_user: isAdminUser,
      is_deleted: isDeleted,
      id,
    } = raw;
    return User.create(
      {
        email,
        username,
        password,
        alias,
        isEmailVerified,
        isAdminUser,
        isDeleted,
      },
      new UniqueEntityID(id)
    );
  }
}
