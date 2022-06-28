import { IUserRepo } from './IUserRepo';
import { UserEmail } from '../domain/userEmail';
import { User } from '../domain/user';
import { createUser } from '../utils/testUtils';
import { UserMap } from '../mappers/UserMap';
import { UnitOfWorkFake } from '../../../core/infra/unitOfWork/UnitOfWorkFake';

export class UserRepoFake implements IUserRepo {
  private unitOfWork: UnitOfWorkFake;

  constructor(unitOfWork: UnitOfWorkFake) {
    this.unitOfWork = unitOfWork;
  }

  findUserByUsername(username: string): Promise<User | null> {
    return new Promise((resolve) => {
      if (username === 'taken_username') {
        resolve(createUser({ username }));
      } else {
        resolve(null);
      }
    });
  }
  exists(email: UserEmail): Promise<boolean> {
    return new Promise((resolve) => {
      if (email.value === 'already@taken.com') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  async save(user: User) {
    if (user.username.value === 'THROW_WHEN_SAVE')
      throw Error('Faked failure when saving');
    const Item = await UserMap.toPersistence(user);
    this.unitOfWork.addTransaction({
      Put: {
        TableName: 'TableNameFaked',
        Item,
      },
    });
  }
}
