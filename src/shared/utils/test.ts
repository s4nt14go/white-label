import { EntityID } from '../domain/EntityID';
import { User } from '../../modules/users/domain/User';
import { UserName } from '../../modules/users/domain/UserName';
import { UserPassword } from '../../modules/users/domain/UserPassword';
import { UserEmail } from '../../modules/users/domain/UserEmail';
import { Alias } from '../../modules/users/domain/Alias';
import { TextDecoder } from 'util';
import Chance from 'chance';
import { CreateUserDTO } from '../../modules/users/useCases/createUser/CreateUserDTO';
import { Transaction } from 'sequelize';
import { APIGatewayEvent } from 'aws-lambda';

const chance = new Chance();

type CreateUserInput = {
  email?: string;
  password?: string;
  username?: string;
  alias?: string;
  isEmailVerified?: boolean;
  id?: EntityID;
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

export const getNewUserDto = (): CreateUserDTO => ({
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

export const fakeTransaction = null as unknown as Promise<Transaction>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getAPIGatewayEvent = (data: any) => {
  return { body: JSON.stringify(data) } as unknown as APIGatewayEvent;
}
