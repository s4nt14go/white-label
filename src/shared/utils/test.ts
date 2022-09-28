import { EntityID } from '../domain/EntityID';
import { User } from '../../modules/users/domain/User';
import { UserName } from '../../modules/users/domain/UserName';
import { UserPassword } from '../../modules/users/domain/UserPassword';
import { UserEmail } from '../../modules/users/domain/UserEmail';
import { Alias } from '../../modules/users/domain/Alias';
import { TextDecoder, TextEncoder } from 'util';
import Chance from 'chance';
import { Request } from '../../modules/users/useCases/createUser/CreateUserDTO';
import { Transaction as SequelizeTransaction } from 'sequelize';
import { AppSyncResolverEvent } from 'aws-lambda';
import { Lambda } from '@aws-sdk/client-lambda';
import stringify from 'json-stringify-safe';
import bigDecimal = require('js-big-decimal');
import { Amount } from '../../modules/accounts/domain/Amount';
import { Description } from '../../modules/accounts/domain/Description';
import { Account } from '../../modules/accounts/domain/Account';
import { Transaction } from '../../modules/accounts/domain/Transaction';
import * as velocityUtil from 'amplify-appsync-simulator/lib/velocity/util';
import fs from 'fs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import velocityTemplate from 'amplify-velocity-template';
import * as velocityMapper from 'amplify-appsync-simulator/lib/velocity/value-mapper/mapper';

export const invokeVtl = (templatePath: string, context: unknown) => {
  const template = fs.readFileSync(templatePath, { encoding: 'utf-8' });
  const ast = velocityTemplate.parse(template);
  const compiler = new velocityTemplate.Compile(ast, {
    valueMapper: velocityMapper.map,
    escape: false,
  });
  return JSON.parse(compiler.render(context));
};

export const getAppsyncContext = (result: unknown) => {
  const args = null;
  const util = velocityUtil.create([], new Date(), Object(), Object());
  const context = {
    identity: null,
    args,
    arguments: args,
    result,
    source: null,
    info: null,
    prev: null,
    stash: null,
    error: null,
  };
  return {
    context,
    ctx: context,
    util,
    utils: util,
  };
};

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

export const getNewUserDto = (): Request => ({
  username: chance.first(),
  email: chance.email(),
  password: 'passwordd',
  alias: 'test_alias',
});

const parsePayload = (payload?: Uint8Array) => {
  const decoded = new TextDecoder().decode(payload);
  console.log('decoded', decoded);
  return JSON.parse(decoded);
};

export const fakeTransaction = null as unknown as Promise<SequelizeTransaction>;

export const getAppSyncEvent = (data: unknown) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { arguments: data } as AppSyncResolverEvent<any>;
};

const MAX_ABS_SAFE_NUMBER = Number.MAX_SAFE_INTEGER / 100;
export const getQty = ({
  min = -MAX_ABS_SAFE_NUMBER,
  max = MAX_ABS_SAFE_NUMBER,
  halfScale = false,
}) => {
  const randomFS = chance.floating({
    min,
    fixed: 2,
    max,
  });
  if (!halfScale) return randomFS;
  return Math.round((randomFS * 100) / 2) / 100;
};

export const add3 = (a: number, b: number, c: number) => {
  const aRounded = bigDecimal.round(a, 2);
  const bRounded = bigDecimal.round(b, 2);
  const cRounded = bigDecimal.round(c, 2);
  const temp = bigDecimal.add(aRounded, bRounded);
  return bigDecimal.add(temp, cRounded);
};

const lambdaClient = new Lambda({});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const invokeLambda = async (dto: any, FunctionName: string) => {
  const req = {
    FunctionName,
    Payload: new TextEncoder().encode(stringify(dto)),
  };

  const result = await lambdaClient.invoke(req);

  return parsePayload(result.Payload);
};

export function seedAccount(active = true) {
  const seedTransaction = Transaction.create({
    balance: Amount.create({ value: 200 }).value,
    delta: Amount.create({ value: 100 }).value,
    date: new Date(),
    description: Description.create({ value: 'Test: Seed transaction' }).value,
  }).value;
  return Account.create({
    active,
    transactions: [seedTransaction],
  }).value;
}
