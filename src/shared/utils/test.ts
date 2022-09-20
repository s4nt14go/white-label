import { EntityID } from '../domain/EntityID';
import { User } from '../../modules/users/domain/User';
import { UserName } from '../../modules/users/domain/UserName';
import { UserPassword } from '../../modules/users/domain/UserPassword';
import { UserEmail } from '../../modules/users/domain/UserEmail';
import { Alias } from '../../modules/users/domain/Alias';
import { TextDecoder, TextEncoder } from 'util';
import Chance from 'chance';
import { Request } from '../../modules/users/useCases/createUser/CreateUserDTO';
import { Transaction } from 'sequelize';
import { APIGatewayEvent, AppSyncResolverEvent } from 'aws-lambda';
import { Lambda } from '@aws-sdk/client-lambda';
import stringify from 'json-stringify-safe';
import fetch from 'node-fetch';
import bigDecimal = require('js-big-decimal');

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
  const parsed = JSON.parse(decoded);
  // For API Gateway response we have to parse the body, while AppSync don't have a body property and the result is already parsed
  if (parsed.body) parsed.body = JSON.parse(parsed.body);
  return parsed;
};

export const fakeTransaction = null as unknown as Promise<Transaction>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getAPIGatewayPOSTevent = (data: any) => {
  return { body: JSON.stringify(data) } as unknown as APIGatewayEvent;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getAPIGatewayGETevent = (data: any) => {
  return { queryStringParameters: data } as unknown as APIGatewayEvent;
};

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

export class AppSync {
  private readonly url: string;
  private readonly key: string;

  public constructor(url: string, key: string) {
    this.url = url;
    this.key = key;
  }

  public query({ query, variables }: { query: string; variables: unknown }) {
    return fetch(this.url, {
      method: 'post',
      headers: {
        'x-api-key': this.key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });
  }
}
