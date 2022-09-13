import * as dotenv from 'dotenv';
dotenv.config();
import setHooks from '../../../../shared/infra/database/sequelize/hooks';
import { DispatcherFake } from '../../../../shared/infra/dispatchEvents/DispatcherFake';
import { CreateUserController } from './CreateUserController';
import {
  fakeTransaction, getAPIGatewayEvent,
  getNewUserDto,
} from '../../../../shared/utils/test';
import {
  CreatedUser,
  deleteUsers,
  UserRepo,
} from '../../../../shared/utils/repos';
import { UserRepoFake } from '../../repos/UserRepoFake';
import { IDispatcher } from '../../../../shared/domain/events/DomainEvents';
import { IDomainEvent } from '../../../../shared/domain/events/IDomainEvent';
import { Context } from 'aws-lambda';

// Add all process.env used:
const { distributeDomainEvents } = process.env;
if (!distributeDomainEvents) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

let createUserController: CreateUserController,
  dispatcherFake: IDispatcher,
  spyOnDispatch: jest.SpyInstance<
    Promise<unknown>,
    [event: IDomainEvent, handler: string]
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
  createUserController = new CreateUserController(UserRepo, dispatcherFake, fakeTransaction);

  const newUser = getNewUserDto();

  const response = await createUserController.execute(getAPIGatewayEvent(newUser), context);
  expect(response.statusCode).toBe(201);

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
  const id = JSON.parse(response.body).result.id;
  createdUsers.push({ id })
});

test(`distributeDomainEvents isn't called when saving to DB fails`, async () => {
  createUserController = new CreateUserController(
    new UserRepoFake(),
    dispatcherFake,
    fakeTransaction,
  );

  const newUser = {
    ...getNewUserDto(),
    username: 'THROW_WHEN_SAVE',
  };

  try {
    await createUserController.execute(getAPIGatewayEvent(newUser), context);
    // eslint-disable-next-line no-empty
  } catch {}

  expect(spyOnDispatch).toBeCalledTimes(0);
});
