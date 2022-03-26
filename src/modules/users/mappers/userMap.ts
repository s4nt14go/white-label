import { UniqueEntityID } from '../../../core/domain/UniqueEntityID';
import { User } from '../domain/user';
import { UserName } from '../domain/userName';
import { UserPassword } from '../domain/userPassword';
import { UserEmail } from '../domain/userEmail';

export class UserMap {
  public static toDomain (raw: any): User {
    const { _id, props: { email, password, username, isDeleted, isEmailVerified, isAdminUser } } = raw;
    const userNameOrError = UserName.create({ name: username.props.name });
    const userPasswordOrError = UserPassword.create({ value: password.props.value, hashed: password.props.hashed });
    const userEmailOrError = UserEmail.create(email.props.value);

    const userOrError = User.create({
      username: userNameOrError.getValue() as UserName,
      password: userPasswordOrError.getValue() as UserPassword,
      email: userEmailOrError.getValue() as UserEmail,
      isAdminUser,
      isDeleted,
      isEmailVerified,
    }, new UniqueEntityID(_id.value)).getValue();

    return userOrError as User;
  }
}