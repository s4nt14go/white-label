import { StoreEvent } from './StoreEvent';
import { EventStorage } from '../../../../shared/infra/dynamo/EventStorage';
import { UserCreatedEventDTO } from '../../../users/domain/events/UserCreatedEvent';
import {
  TransactionCreatedEventStored,
  UserCreatedEventStored,
} from '../../services/IStorage';
import { TransactionCreatedEventDTO } from '../../../accounts/domain/events/TransactionCreatedEvent';
import Chance from 'chance';

const chance = new Chance();

let useCase: StoreEvent,
  spy: jest.SpyInstance<
    Promise<void>,
    [eventStored: UserCreatedEventStored | TransactionCreatedEventStored]
  >;
beforeAll(async () => {
  const dynamo = new EventStorage('dummy');
  spy = jest
    .spyOn(dynamo, 'saveEvent')
    .mockImplementation(() => new Promise((resolve) => resolve(Object())));

  useCase = new StoreEvent(dynamo);
});

beforeEach(async () => {
  spy.mockClear();
});

it('stores UserCreatedEvent', async () => {
  const event: UserCreatedEventDTO = {
    user: {
      email: chance.email(),
      username: chance.name(),
    },
    type: 'UserCreatedEvent',
    aggregateId: chance.guid(),
    dateTimeOccurred: chance.date().toJSON(),
    version: chance.natural(),
  };
  await useCase.execute(event);

  const {
    user: { email, username },
    type,
    aggregateId,
    dateTimeOccurred,
    version,
  } = event;

  const stored: UserCreatedEventStored = {
    type,
    version,
    aggregateId,
    dateTimeOccurred,
    username,
    email,
  };
  expect(spy).toHaveBeenCalledWith(stored);
});

it('stores TransactionCreatedEvent', async () => {
  const event: TransactionCreatedEventDTO = {
    transaction: {
      id: chance.guid(),
      date: chance.date().toJSON(),
      delta: chance.floating({ fixed: 2 }),
      description: chance.sentence(),
      balance: chance.floating({ fixed: 2 }),
    },
    type: 'TransactionCreatedEvent',
    aggregateId: chance.guid(),
    dateTimeOccurred: chance.date().toJSON(),
    version: chance.natural(),
  };
  await useCase.execute(event);

  const {
    transaction: { id, date, delta, description, balance },
    type,
    aggregateId,
    dateTimeOccurred,
    version,
  } = event;

  const stored: TransactionCreatedEventStored = {
    type,
    version,
    aggregateId,
    dateTimeOccurred,
    id,
    date,
    delta,
    description,
    balance,
  };
  expect(spy).toHaveBeenCalledWith(stored);
});
