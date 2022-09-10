import { User } from '../domain/User';
import { UserEmail } from '../domain/UserEmail';
import { UserName } from '../domain/UserName';
import { Transaction } from 'sequelize';
import { IRepo } from '../../../shared/core/IRepo';

export declare class IUserRepo implements IRepo {
  public setTransaction(transaction?: Transaction): void;
  public findUserByUsername(userName: UserName | string): Promise<User | null>;
  public exists(email: UserEmail): Promise<boolean>;
  public create(user: User): void;
}
