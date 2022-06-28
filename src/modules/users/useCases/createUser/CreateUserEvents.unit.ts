// Set env var distributeDomainEvents used by CreateUserController -> loads CreateUserEvents -> loads Env -> reads process.env.distributeDomainEvents
process.env.distributeDomainEvents = 'distributeDomainEventsLambda';
import { CreateUserController } from './CreateUserController';
import { UserRepoFake } from '../../repos/UserRepoFake';
import { DispatcherFake } from '../../../../core/infra/dispatchEvents/DispatcherFake';
import { UnitOfWorkFake } from '../../../../core/infra/unitOfWork/UnitOfWorkFake';

let createUserController: CreateUserController,
  dispatcherFake,
  spyOnDispatch: unknown;
const unitOfWorkFake = new UnitOfWorkFake();
beforeEach(() => {
  dispatcherFake = new DispatcherFake();
  spyOnDispatch = jest.spyOn(dispatcherFake, 'dispatch');
  createUserController = new CreateUserController(
    unitOfWorkFake,
    new UserRepoFake(unitOfWorkFake),
    dispatcherFake
  );
});

test('Domain event dispatcher calls distributeDomainEvents with user data for UserCreatedEvent', async () => {
  const dto = {
    username: 'test_username',
    email: 'test@email.com',
    password: 'passwordd',
  };

  await createUserController.executeImpl(dto);

  const dispatcherIntake = expect.objectContaining({
    aggregateId: expect.any(String),
    dateTimeOccurred: expect.any(Date),
    user: {
      username: 'test_username',
      email: 'test@email.com',
    },
  });
  expect(spyOnDispatch).toHaveBeenCalledWith(
    dispatcherIntake,
    expect.stringContaining('distributeDomainEventsLambda') // process.env.distributeDomainEvents set before importing CreateUserController
  );
  expect(spyOnDispatch).toBeCalledTimes(1);
});

test(`distributeDomainEvents isn't called when saving to DB fails`, async () => {
  const dto = {
    username: 'THROW_WHEN_SAVE',
    email: 'test@email.com',
    password: 'passwordd',
  };

  try {
    await createUserController.executeImpl(dto);
    // eslint-disable-next-line no-empty
  } catch {}

  expect(spyOnDispatch).toBeCalledTimes(0);
});
