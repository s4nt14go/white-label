import { UniqueEntityID } from '../domain/UniqueEntityID';
import { User } from '../../modules/users/domain/User';
import { UserName } from '../../modules/users/domain/UserName';
import { UserPassword } from '../../modules/users/domain/UserPassword';
import { UserEmail } from '../../modules/users/domain/UserEmail';
import { Alias } from '../../modules/users/domain/Alias';
import { TextDecoder } from 'util';
import Chance from 'chance';
import { CreateUserDTO } from '../../modules/users/useCases/createUser/CreateUserDTO';
import models from '../infra/database/sequelize/models';
import { UserRepo } from '../../modules/users/repos/UserRepo';

const chance = new Chance();
export const repo = new UserRepo(models);

type CreateUserInput = {
  email?: string;
  password?: string;
  username?: string;
  alias?: string;
  isEmailVerified?: boolean;
  id?: UniqueEntityID;
};

export function createUser({
  email = 'default@email.com',
  password = 'default_pass',
  username = 'default_uname',
  alias,
  isEmailVerified = false,
  id,
}: CreateUserInput): User {
  const props = {
    email: UserEmail.create(email).value as UserEmail,
    password: UserPassword.create({ value: password }).value as UserPassword,
    username: UserName.create({ name: username }).value as UserName,
    alias: Alias.create({ value: alias }).value as Alias,
    isEmailVerified,
  };

  return User.create(props, id);
}

export const getNewUser = (): CreateUserDTO => ({
  username: chance.first(),
  email: chance.email(),
  password: 'passwordd',
  alias: 'test_alias',
});

export const parsePayload = (payload?: Uint8Array) => {
  const decoded = new TextDecoder().decode(payload);
  console.log('decoded', decoded);
  const parsed = JSON.parse(decoded);
  parsed.body = JSON.parse(parsed.body);
  return parsed;
};

export type CreatedUser = { id: string };
export const deleteUsers = async (users: CreatedUser[]) => {
  return Promise.all(
    users.map(async (u) => {
      return repo.delete(u.id);
    })
  );
};
