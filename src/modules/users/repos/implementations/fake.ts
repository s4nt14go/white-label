import { IUserRepo } from '../userRepo';
import { UserEmail } from '../../domain/userEmail';
import { User } from '../../domain/user';
import { createUser } from '../../testUtils';

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
        return;
    };
}