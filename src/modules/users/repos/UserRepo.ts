import { User } from '../domain/User';
import { UserMap } from '../mappers/UserMap';
import { UserEmail } from '../domain/UserEmail';
import { IUserRepo } from './IUserRepo';

export class UserRepo implements IUserRepo {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private User: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(models: any) {
    this.User = models.User;
  }

  public async findUserByUsername(username: string): Promise<User | null> {
    const user = await this.User.findOne({
      where: {
        username,
      },
    });
    if (!!user === true) {
      return UserMap.toDomain(user.get());
    }
    return null;
  }

  public async findUserByEmail(_email: UserEmail): Promise<User | null> {
    const email = _email.value.toString();
    const user = await this.User.findOne({
      where: {
        email,
      },
    });
    if (!!user === true) return user;
    return null;
  }

  public async exists(_email: UserEmail): Promise<boolean> {
    const email = _email.value.toString();
    const user = await this.User.findOne({
      where: {
        email,
      },
    });
    return !!user === true;
  }

  public async save(user: User): Promise<void> {
    const exists = await this.exists(user.email);
    const rawUser = await UserMap.toPersistence(user);

    try {
      if (!exists) {
        // Create new
        await this.User.create(rawUser);
      } else {
        // Save old
        const sequelizeUserInstance = await this.User.findOne({
          where: {
            email: user.email.value,
          },
        });
        await sequelizeUserInstance.update(rawUser);
      }
    } catch (err) {
      console.log(err);
    }
  }

  public async delete(_id: string): Promise<void> {
    const id = _id;
    return this.User.destroy({
      where: {
        id,
      },
    });
  }
}
