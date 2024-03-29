import { User } from '../domain/User';
import { UserMap } from '../mappers/UserMap';
import { UserEmail } from '../domain/UserEmail';
import { IUserRepo } from './IUserRepo';
import { Repository } from '../../../shared/core/Repository';
import { EntityID } from '../../../shared/domain/EntityID';

export class UserRepo extends Repository<User> implements IUserRepo {
  // Read comment in src/shared/core/Repository.ts about the use of this.transaction
  private User: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public constructor(models: any) {
    super();
    this.User = models.User;
  }

  public async findUserByUsername(username: string): Promise<User | null> {
    const user = await this.User.findOne(
      {
        where: {
          username,
        },
        transaction: this.transaction,
      },
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
        transaction: this.transaction,
      },
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
        transaction: this.transaction,
      },
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
        transaction: this.transaction,
      },
    );
  }
}
