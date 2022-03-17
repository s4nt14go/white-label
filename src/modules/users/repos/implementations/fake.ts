import { IUserRepo } from '../userRepo';
import { UserEmail } from '../../domain/userEmail';
import { User } from '../../domain/user';
import { createUser } from '../../testUtils';
import { DomainEvents } from '../../../../core/domain/events/DomainEvents';

export class UserRepoFake implements IUserRepo {
    findUserByEmail(email: UserEmail): Promise<User> {
        return new Promise((resolve, _reject) => {
            resolve(createUser({}).getValue());
        });
    }
    findUserByUsername (username: string): Promise<User> {
        return new Promise((resolve, _reject) => {
            resolve(createUser({}).getValue());
        });
    };
    exists (email: UserEmail): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            if (email.value === 'already@taken.com') {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    };
    save(user: User): Promise<void> {
        if (user.firstName === 'PLEASE FAIL WHEN SAVING') throw Error('Faked failure when saving');
        DomainEvents.dispatchEventsForAggregate(user.id);   // NOTE: Even though UserRepoFake is being used for unit tests that won't target downstream effects because of triggered event domains, I prefer to put the dispatching just to keep in mind that this should be done after the aggregate changes we're interested in emitting events for, i.e. create, update, delete, are done in the real repository.
        return;
    };
}