import { User } from '../domain/user';
import { UniqueEntityID } from '../../../core/domain/UniqueEntityID';
import { UserEmail } from '../domain/userEmail';
import { UserPassword } from '../domain/userPassword';
import { UserName } from '../domain/userName';
import { Alias } from '../domain/alias';
import { Result } from '../../../core/logic/Result';

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
      isDeleted,
      isEmailVerified,
      isAdminUser,
      createdAt: new Date().toJSON(),
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

    const { isEmailVerified, isAdminUser, isDeleted, id } = raw;
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
