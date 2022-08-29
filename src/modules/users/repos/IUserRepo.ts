import { User } from '../domain/user';
import { UserEmail } from '../domain/userEmail';
import { UserName } from '../domain/userName';
import { Repository } from '../../../shared/core/Repository';

export declare class IUserRepo extends Repository<User> {
  findUserByUsername(userName: UserName | string): Promise<User | null>;
  exists(email: UserEmail): Promise<boolean>;
  save(user: User): void;
}
