import { User } from '../domain/user';
import { UserEmail } from '../domain/userEmail';
import { UserName } from '../domain/userName';
import { Repository } from '../../../core/domain/Repository';
import { UnitOfWorkDynamo } from '../../../core/infra/unitOfWork/UnitOfWorkDynamo';

export declare class IUserRepo extends Repository<User> {
  constructor(unitOfWork: UnitOfWorkDynamo);
  findUserByUsername(userName: UserName | string): Promise<User | null>;
  exists(email: UserEmail): Promise<boolean>;
  save(user: User): void;
}
