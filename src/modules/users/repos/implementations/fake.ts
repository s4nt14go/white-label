import { IUserRepo } from '../userRepo';
import { UserEmail } from '../../domain/userEmail';
import { User } from '../../domain/user';
import { DomainEvents } from '../../../../core/domain/events/DomainEvents';
import { createUser } from '../../utils/testUtils';

export class UserRepoFake implements IUserRepo {
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
    await DomainEvents.dispatchEventsForAggregate(user.id); // NOTE: Dispatch the events after the aggregate changes we're interested to emit (i.e. create, update, delete), are done in the real/faked repository.
  }
}
