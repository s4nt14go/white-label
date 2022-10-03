import { User } from '../domain/User';
import { EntityID } from '../../../shared/domain/EntityID';
import { UserEmail } from '../domain/UserEmail';
import { UserPassword } from '../domain/UserPassword';
import { UserName } from '../domain/UserName';
import { Alias } from '../domain/Alias';

export class UserMap {
  public static async toPersistence(user: User): Promise<unknown> {
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
    return User.create(
      {
        email: UserEmail.create(raw.email).value,
        username: UserName.create({ name: raw.username }).value,
        password: UserPassword.create({ value: raw.password }).value,
        alias: Alias.create({ value: raw.alias }).value,
        isEmailVerified: raw.is_email_verified,
        isAdminUser: raw.is_admin_user,
        isDeleted: raw.is_deleted,
      },
      new EntityID(raw.id)
    );
  }
}
