
import { User } from "../domain/user";
import { UserEmail } from "../domain/userEmail";
import { UserName } from '../domain/userName';
import { Repository } from "../../../core/domain/Repository";

export interface IUserRepo extends Repository<User> {
  findUserByEmail(email: UserEmail): Promise<User>;
  findUserByUsername (userName: UserName | string): Promise<User | null>;
  exists (email: UserEmail): Promise<boolean>;
  save(user: User): Promise<void>;
}
