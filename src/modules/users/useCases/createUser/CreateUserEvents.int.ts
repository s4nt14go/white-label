import * as dotenv from 'dotenv';
dotenv.config();
import setHooks from '../../../../shared/infra/database/sequelize/hooks';
import { DispatcherFake } from '../../../../shared/infra/dispatchEvents/DispatcherFake';
import { CreateUser } from './CreateUser';
import {
  fakeTransaction, getAppSyncEvent as getEvent,
  getNewUserDto,
} from '../../../../shared/utils/test';
import {
  CreatedUser,
  deleteUsers,
  UserRepo,
} from '../../../../shared/utils/repos';
import { UserRepoFake } from '../../repos/UserRepoFake';
import { IDispatcher } from '../../../../shared/domain/events/DomainEvents';
import { DomainEventBase } from '../../../../shared/domain/events/DomainEventBase';
import { Context } from 'aws-lambda';
import { Envelope } from '../../../../shared/core/Envelope';
import { Created } from '../../../../shared/core/Created';

// Add all process.env used:
const { distributeDomainEvents } = process.env;
if (!distributeDomainEvents) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

let createUser: CreateUser,
  dispatcherFake: IDispatcher,
  spyOnDispatch: jest.SpyInstance<
    Promise<unknown>,
    [event: DomainEventBase, handler: string]
  >;
beforeAll(() => {
  setHooks();
  dispatcherFake = new DispatcherFake();
  spyOnDispatch = jest.spyOn(dispatcherFake, 'dispatch');
});

beforeEach(() => {
  spyOnDispatch.mockClear();
});

const createdUsers: CreatedUser[] = [];
afterAll(async () => {
  await deleteUsers(createdUsers);
});

const context = {} as unknown as Context;
test('Domain event dispatcher calls distributeDomainEvents with user data for UserCreatedEvent', async () => {
  createUser = new CreateUser(UserRepo, dispatcherFake, {}, fakeTransaction);

  const newUser = getNewUserDto();

  const response = await createUser.execute(getEvent(newUser), context) as Envelope<Created>;

  expect(response).toMatchObject({
    time: expect.any(String),
    result: {
      id: expect.any(String),
    }
  });

  const dispatcherIntake = expect.objectContaining({
    aggregateId: expect.any(String),
    dateTimeOccurred: expect.any(Date),
    user: {
      username: newUser.username,
      email: newUser.email,
    },
    type: 'UserCreatedEvent',
    version: 0,
  });
  expect(spyOnDispatch).toHaveBeenCalledWith(
    dispatcherIntake,
    distributeDomainEvents
  );
  expect(spyOnDispatch).toBeCalledTimes(1);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const id = response.result!.id;
  createdUsers.push({ id })
});

test(`distributeDomainEvents isn't called when saving to DB fails`, async () => {
  createUser = new CreateUser(
    new UserRepoFake(),
    dispatcherFake,
    {},
    fakeTransaction,
  );

  const newUser = {
    ...getNewUserDto(),
    username: 'THROW_WHEN_SAVE',
  };

  try {
    await createUser.execute(getEvent(newUser), context);
    // eslint-disable-next-line no-empty
  } catch {}

  expect(spyOnDispatch).toBeCalledTimes(0);
});
