import { User } from '../domain/User';
import { UserEmail } from '../domain/UserEmail';
import { UserName } from '../domain/UserName';
import { Transaction } from 'sequelize';
import { IRepo } from '../../../shared/core/IRepo';

export declare class IUserRepo implements IRepo {
  setTransaction(transaction?: Transaction): void;
  findUserByUsername(userName: UserName | string): Promise<User | null>;
  exists(email: UserEmail): Promise<boolean>;
  save(user: User): void;
}
