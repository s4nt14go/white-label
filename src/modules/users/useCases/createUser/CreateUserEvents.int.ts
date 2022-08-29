import * as dotenv from 'dotenv';
dotenv.config();
import setHooks from '../../../../shared/infra/database/sequelize/hooks';
import { DispatcherFake } from '../../../../shared/infra/dispatchEvents/DispatcherFake';
import { CreateUserController } from './CreateUserController';
import {
  getNewUser,
} from '../../../../shared/utils/test';
import {
  CreatedUser,
  deleteUsers,
  repo,
} from '../../../../shared/utils/realRepoForTests';
import { UserEmail } from '../../domain/UserEmail';
import { UserRepoFake } from '../../repos/UserRepoFake';
import { IDispatcher } from '../../../../shared/domain/events/DomainEvents';
import { IDomainEvent } from '../../../../shared/domain/events/IDomainEvent';

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

test('Domain event dispatcher calls distributeDomainEvents with user data for UserCreatedEvent', async () => {
  createUserController = new CreateUserController(repo, dispatcherFake);

  const newUser = getNewUser();

  const response = await createUserController.executeImpl(newUser);
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
    process.env.distributeDomainEvents
  );
  expect(spyOnDispatch).toBeCalledTimes(1);

  const user = await repo.findUserByEmail(UserEmail.create(newUser.email).value);
  if (!user) throw new Error('Created user not found??');
  createdUsers.push({ id: user.id.toString() });
});

test(`distributeDomainEvents isn't called when saving to DB fails`, async () => {
  createUserController = new CreateUserController(
    new UserRepoFake(),
    dispatcherFake
  );

  const newUser = {
    ...getNewUser(),
    username: 'THROW_WHEN_SAVE',
  };

  try {
    await createUserController.executeImpl(newUser);
    // eslint-disable-next-line no-empty
  } catch {}

  expect(spyOnDispatch).toBeCalledTimes(0);
});
