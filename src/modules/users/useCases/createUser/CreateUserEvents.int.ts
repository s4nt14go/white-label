import * as dotenv from 'dotenv';
dotenv.config();
import setHooks from '../../../../shared/infra/database/sequelize/hooks';
import { LambdaInvokerFake } from '../../../../shared/infra/invocation/LambdaInvokerFake';
import { CreateUser } from './CreateUser';
import {
  dateFormat,
  getAppSyncEvent as getEvent,
  getNewUserDto,
} from '../../../../shared/utils/test';
import {
  CreatedUser,
  deleteUsers,
  UserRepo,
} from '../../../../shared/utils/repos';
import { UserRepoFake } from '../../repos/UserRepoFake';
import { DomainEventBase } from '../../../../shared/domain/events/DomainEventBase';
import { Envelope } from '../../../../shared/core/Envelope';
import { Created } from '../../../../shared/core/Created';
import { IInvoker } from '../../../../shared/infra/invocation/LambdaInvoker';

// Add all process.env used:
const { distributeDomainEvents } = process.env;
if (!distributeDomainEvents) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

let createUser: CreateUser,
  invokerFake: IInvoker,
  spyOnInvoker: jest.SpyInstance<unknown, [event: DomainEventBase, handler: string]>;
beforeAll(() => {
  setHooks();
  invokerFake = new LambdaInvokerFake();
  spyOnInvoker = jest.spyOn(invokerFake, 'invoke');
});

beforeEach(() => {
  spyOnInvoker.mockClear();
});

const createdUsers: CreatedUser[] = [];
afterAll(async () => {
  await deleteUsers(createdUsers);
});

test('Domain event dispatcher invokes distributeDomainEvents with user data for UserCreatedEvent', async () => {
  createUser = new CreateUser(UserRepo, invokerFake);

  const newUser = getNewUserDto();

  const response = (await createUser.execute(
    getEvent(newUser),
  )) as Envelope<Created>;

  expect(response).toMatchObject({
    time: expect.stringMatching(dateFormat),
    result: {
      id: expect.any(String),
    },
  });

  const invokerIntake = expect.objectContaining({
    aggregateId: expect.any(String),
    dateTimeOccurred: expect.any(Date),
    user: {
      username: newUser.username,
      email: newUser.email,
    },
    type: 'UserCreatedEvent',
    version: 0,
  });
  expect(spyOnInvoker).toHaveBeenCalledWith(
    invokerIntake,
    distributeDomainEvents
  );
  expect(spyOnInvoker).toBeCalledTimes(1);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const id = response.result!.id;
  createdUsers.push({ id });
});

test(`distributeDomainEvents isn't called when saving to DB fails [createUser]`, async () => {
  createUser = new CreateUser(new UserRepoFake(), invokerFake);

  const newUser = {
    ...getNewUserDto(),
    username: 'THROW_WHEN_SAVE',
  };

  try {
    await createUser.execute(getEvent(newUser));
    // eslint-disable-next-line no-empty
  } catch {}

  expect(spyOnInvoker).toBeCalledTimes(0);
});
