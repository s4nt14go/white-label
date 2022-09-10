import { User } from '../domain/User';
import { UserMap } from '../mappers/UserMap';
import { UserEmail } from '../domain/UserEmail';
import { IUserRepo } from './IUserRepo';
import { Repository } from '../../../shared/core/Repository';
import { EntityID } from '../../../shared/domain/EntityID';

export class UserRepo extends Repository<User> implements IUserRepo {
  private User: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public constructor(models: any) {
    super();
    // Put this.transaction in all repos queries: this.<Model>.<find/create/destroy/etc>({...}, { transaction: this.transaction })
    // If no getTransaction is passed to controller/use case, it's null and doesn't have effect (SQL transaction isn't' used)
    this.User = models.User;
  }

  public async findUserByUsername(username: string): Promise<User | null> {
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

  public async findUserByEmail(_email: UserEmail): Promise<User | null> {
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

  public async exists(_email: UserEmail): Promise<boolean> {
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

  public async create(user: User): Promise<EntityID> {
    const rawUser = await UserMap.toPersistence(user);
    await this.User.create(rawUser, { transaction: this.transaction });
    return user.id;
  }

  public async delete(id: string): Promise<void> {
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
