import { User } from '../domain/User';
import { UserEmail } from '../domain/UserEmail';
import { UserName } from '../domain/UserName';
import { Repository } from '../../../shared/core/Repository';

export declare class IUserRepo extends Repository<User> {
  findUserByUsername(userName: UserName | string): Promise<User | null>;
  exists(email: UserEmail): Promise<boolean>;
  save(user: User): void;
}
