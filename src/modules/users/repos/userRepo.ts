
import { User } from "../domain/user";
import { UserEmail } from "../domain/userEmail";
import { UserName } from '../domain/userName';
import { Repository } from "../../../core/domain/Repository";
import { Result } from '../../../core/logic/Result';
import { BaseError } from '../../../core/logic/AppError';

export interface IUserRepo extends Repository<User> {
  findUserByEmail(email: UserEmail): Promise<User>;
  findUserByUsername (userName: UserName | string): Promise<User | null>;
  exists (email: UserEmail): Promise<boolean>;
  save(user: User): Promise<Result<void | null>>;
}

export class DBerror extends BaseError {
  constructor () {
    super(`Faked failure when saving`)
  }
}
