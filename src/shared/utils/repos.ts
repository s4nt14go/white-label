// eslint-disable-next-line @typescript-eslint/no-var-requires
const models = require('../infra/database/sequelize/models/index.ts');
import { UserRepo as _UserRepo } from '../../modules/users/repos/UserRepo';
import { AccountRepo as _AccountRepo } from '../../modules/accounts/repos/AccountRepo';
import { getNewUserDto } from './test';
import { User } from '../../modules/users/domain/User';
import { UserEmail } from '../../modules/users/domain/UserEmail';
import { UserPassword } from '../../modules/users/domain/UserPassword';
import { UserName } from '../../modules/users/domain/UserName';
import { Alias } from '../../modules/users/domain/Alias';
import { Account } from '../../modules/accounts/domain/Account';

// Load real repo for integration and e2e tests, but avoid loading them for unit test as that gives error on ci pipeline
export const UserRepo = new _UserRepo(models);
export const AccountRepo = new _AccountRepo(models);

export type CreatedUser = { id: string };
// Delete user, account and transactions
export const deleteUsers = async (users: CreatedUser[]) => {
  return Promise.all(
    users.map(async (u) => {
      await AccountRepo.deleteByUserId(u.id);
      await UserRepo.delete(u.id);
    })
  );
};

export const getNewUser = (): User => {
  const newUserDto = getNewUserDto();
  const { email, password, username, alias } = newUserDto;
  return User.create({
    email: UserEmail.create(email).value,
    password: UserPassword.create({ value: password }).value,
    username: UserName.create({ name: username }).value,
    alias: Alias.create({ value: alias }).value,
  });
};

// Creates an user and saves it on DB
export const createUser = async (): Promise<User> => {
  const user = getNewUser();
  await UserRepo.create(user);
  return user;
};

export const createUserAndAccount = async (): Promise<{
  account: Account;
  user: User;
}> => {
  const user = await createUser();
  const account = await AccountRepo.create(user.id.toString());
  return { account, user };
};
