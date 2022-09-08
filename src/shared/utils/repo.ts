import models from '../infra/database/sequelize/models';
import { UserRepo as _UserRepo } from '../../modules/users/repos/UserRepo';
import { AccountRepo as _AccountRepo } from '../../modules/accounts/repos/AccountRepo';

// Load real repo for integration and e2e tests, but avoid loading them for unit test as that gives error on ci pipeline
export const UserRepo = new _UserRepo(models);
export const AccountRepo = new _AccountRepo(models);

export type CreatedUser = { id: string };
export const deleteUsers = async (users: CreatedUser[]) => {
  return Promise.all(
    users.map(async (u) => {
      await AccountRepo.deleteByUserId(u.id);
      await UserRepo.delete(u.id);
    })
  );
};
