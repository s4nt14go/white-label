import { IUserRepo } from './IUserRepo';
import { UserEmail } from '../domain/UserEmail';
import { User } from '../domain/User';
import { createUser } from '../../../shared/utils/test';
import { Repository } from '../../../shared/core/Repository';

export class UserRepoFake extends Repository<User> implements IUserRepo {
  public findUserByUsername(username: string): Promise<User | null> {
    return new Promise((resolve) => {
      if (username === 'taken_username') {
        resolve(createUser({ username }));
      } else {
        resolve(null);
      }
    });
  }
  public exists(email: UserEmail): Promise<boolean> {
    return new Promise((resolve) => {
      if (email.value === 'already@taken.com') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  public async create(user: User) {
    if (user.username.value === 'THROW_WHEN_SAVE')
      throw Error('Faked failure when saving');
  }
}
