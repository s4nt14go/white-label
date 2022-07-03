import '../../../../environment';
import { UniqueEntityID } from '../../../core/domain/UniqueEntityID';
import { User } from '../domain/user';
import { UserName } from '../domain/userName';
import { UserPassword } from '../domain/userPassword';
import { UserEmail } from '../domain/userEmail';
import { Alias } from '../domain/alias';
import { TextDecoder } from 'util';
import Chance from 'chance';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import { CreateUserDTO } from '../useCases/createUser/CreateUserDTO';
import retry from 'async-retry';
import { UnitOfWorkDynamo } from '../../../core/infra/unitOfWork/UnitOfWorkDynamo';
import { UserRepoDynamo } from '../repos/UserRepoDynamo';

const chance = new Chance();
const unitOfWork = new UnitOfWorkDynamo();
const repo = new UserRepoDynamo(unitOfWork);

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

export type CreatedUser = { id: string }
export const deleteUsers = (
  users: CreatedUser[],
  UsersTable: string,
  AWS_REGION: string,
) => {
  const DocumentClient = new DynamoDB.DocumentClient({ region: AWS_REGION });
  users.map(async (u) => {
    return await DocumentClient.delete({
      TableName: UsersTable,
      Key: {
        ...u,
      },
    }).promise();
  });
}

export const findByUsernameWithRetry = async (username: string, retries: number) : Promise<User> => {
  return await retry(async (_bail, _attempt) => {
    console.log(`find attempt: ${_attempt}`);
    const user = await repo.findUserByUsername(username);
    if (!user) throw new Error(`User not found`);
    return user;
  }, {
    retries,
  });
}
