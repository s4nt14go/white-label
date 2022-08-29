import models from '../infra/database/sequelize/models';
import { UserRepo } from '../../modules/users/repos/UserRepo';

export const repo = new UserRepo(models);

export type CreatedUser = { id: string };
export const deleteUsers = async (users: CreatedUser[]) => {
  return Promise.all(
    users.map(async (u) => {
      return repo.delete(u.id);
    })
  );
};

