import { EntityID } from '../domain/EntityID';
import { User } from '../../modules/users/domain/User';
import { UserName } from '../../modules/users/domain/UserName';
import { UserPassword } from '../../modules/users/domain/UserPassword';
import { UserEmail } from '../../modules/users/domain/UserEmail';
import { Alias } from '../../modules/users/domain/Alias';
import { TextDecoder, TextEncoder } from 'util';
import Chance from 'chance';
import { Request as CreateUserDTOreq } from '../../modules/users/useCases/createUser/CreateUserDTOs';
import { Transaction as SequelizeTransaction } from 'sequelize';
import { AppSyncResolverEvent } from 'aws-lambda';
import { Lambda } from '@aws-sdk/client-lambda';
import stringify from 'json-stringify-safe';
// To check js quirks when dealing with numbers, it outputs strings. E.g  0.1 + 0.2 in js is 0.30000000000000004 (number), while bigDecimal.add(0.1, 0.2) gives correctly "0.3" (string)
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
import DynamoDB from 'aws-sdk/clients/dynamodb';

const DocumentClient = new DynamoDB.DocumentClient();

export const invokeVtl = (templatePath: string, input: unknown) => {
  const template = fs.readFileSync(templatePath, { encoding: 'utf-8' });
  const ast = velocityTemplate.parse(template);
  const compiler = new velocityTemplate.Compile(ast, {
    valueMapper: velocityMapper.map,
    escape: false,
  });
  return JSON.parse(compiler.render(input));
};

export const getAppsyncInput = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any,
  args: unknown = null,
  error: unknown = null
) => {
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
    error,
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

export const getNewUserDto = (): CreateUserDTOreq => ({
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

// Add two or three decimal numbers
export const addDecimals = (a: number, b: number, c = 0) => {
  const aRounded = bigDecimal.round(a, 2);
  const bRounded = bigDecimal.round(b, 2);
  const cRounded = bigDecimal.round(c, 2);
  const temp = bigDecimal.add(aRounded, bRounded);
  const stringResult = bigDecimal.add(temp, cRounded);
  const result = Number(stringResult);
  if (Math.abs(result) > Number.MAX_SAFE_INTEGER)
    throw Error(
      `addDecimals error: casting Number(${result}) it's not safe in js`
    );
  return result;
};

const lambdaClient = new Lambda({});
export const invokeLambda = async (dto: unknown, FunctionName: string) => {
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

export function getRandom({ min = -Amount.MAX_ABS, max = Amount.MAX_ABS }) {
  return chance.floating({ min, fixed: 2, max });
}

export const getByPart = async (
  partName: string,
  partValue: string,
  TableName: string
) => {
  const res = await DocumentClient.query({
    TableName,
    KeyConditionExpression: `${partName} = :pk`,
    ExpressionAttributeValues: {
      ':pk': partValue,
    },
  }).promise();
  return res.Items;
};
export const deleteItems = async (
  Keys: Record<string, unknown>[],
  TableName: string
) => {
  return Promise.all(
    Keys.map(async (Key) => {
      await DocumentClient.delete({
        TableName,
        Key,
      }).promise();
    })
  );
};

export const retryDefault = {
  retries: 10,
  maxTimeout: 1000,
};
