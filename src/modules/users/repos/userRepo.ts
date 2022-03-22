
import { User } from "../domain/user";
import { UserEmail } from "../domain/userEmail";
import { UserName } from '../domain/userName';

export interface IUserRepo {
  findUserByEmail(email: UserEmail): Promise<User>;
  findUserByUsername (userName: UserName | string): Promise<User | null>;
  exists (email: UserEmail): Promise<boolean>;
  save(user: User): Promise<void>;
}
