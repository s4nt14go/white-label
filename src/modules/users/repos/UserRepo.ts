import { User } from '../domain/User';
import { UserMap } from '../mappers/UserMap';
import { UserEmail } from '../domain/UserEmail';
import { IUserRepo } from './IUserRepo';
import { Repository } from '../../../shared/core/Repository';

export class UserRepo extends Repository<User> implements IUserRepo {
  private User: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(models: any) {
    super();
    // Put this.transaction in all repos queries: this.<Model>.<find/create/destroy/etc>({...}, { transaction: this.transaction })
    // If no getTransaction is passed to controller/use case, it's null and doesn't have effect (SQL transaction isn't' used)
    this.User = models.User;
  }

  async findUserByUsername(username: string): Promise<User | null> {
    const user = await this.User.findOne(
      {
        where: {
          username,
        },
      },
      { transaction: this.transaction }
    );
    if (user) return UserMap.toDomain(user.get());
    return null;
  }

  async findUserByEmail(_email: UserEmail): Promise<User | null> {
    const email = _email.value.toString();
    const user = await this.User.findOne(
      {
        where: {
          email,
        },
      },
      { transaction: this.transaction }
    );
    if (user) return UserMap.toDomain(user.get());
    return null;
  }

  async exists(_email: UserEmail): Promise<boolean> {
    const email = _email.value.toString();
    const user = await this.User.findOne(
      {
        where: {
          email,
        },
      },
      { transaction: this.transaction }
    );
    return !!user;
  }

  async save(user: User): Promise<void> {
    const exists = await this.exists(user.email);
    const rawUser = await UserMap.toPersistence(user);

    if (!exists) {
      // Create new
      await this.User.create(rawUser, { transaction: this.transaction });
    } else {
      // Save old
      const sequelizeUserInstance = await this.User.findOne(
        {
          where: {
            email: user.email.value,
          },
        },
        { transaction: this.transaction }
      );
      await sequelizeUserInstance.update(rawUser);
    }
  }

  async delete(id: string): Promise<void> {
    return this.User.destroy(
      {
        where: {
          id,
        },
      },
      { transaction: this.transaction }
    );
  }
}
