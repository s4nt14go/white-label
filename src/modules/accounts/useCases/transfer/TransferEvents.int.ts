import * as dotenv from 'dotenv';
dotenv.config();
import setHooks from '../../../../shared/infra/database/sequelize/hooks';
import { DispatcherFake } from '../../../../shared/infra/dispatchEvents/DispatcherFake';
import { Transfer } from './Transfer';
import {
  fakeTransaction,
  getAppSyncEvent as getEvent,
} from '../../../../shared/utils/test';
import {
  AccountRepo,
  createUserAndAccount,
  deleteUsers,
} from '../../../../shared/utils/repos';
import { IDispatcher } from '../../../../shared/domain/events/DomainEvents';
import { DomainEventBase } from '../../../../shared/domain/events/DomainEventBase';
import { Context } from 'aws-lambda';
import { Envelope } from '../../../../shared/core/Envelope';
import { Created } from '../../../../shared/core/Created';
import { Account } from '../../domain/Account';
import { Request } from './TransferDTO';
import { Transaction } from '../../domain/Transaction';
import { Amount } from '../../domain/Amount';
import { Description } from '../../domain/Description';
import Chance from 'chance';
import { AccountRepoFake } from '../../repos/AccountRepoFake';

const chance = new Chance();

// Add all process.env used:
const { distributeDomainEvents } = process.env;
if (!distributeDomainEvents) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

let transfer: Transfer,
  dispatcherFake: IDispatcher,
  spyOnDispatch: jest.SpyInstance<void, [event: DomainEventBase, handler: string]>;
interface Seed {
  userId: string;
  account: Account;
}
let fromSeed: Seed, toSeed: Seed, fund: number;
beforeAll(async () => {
  setHooks();
  dispatcherFake = new DispatcherFake();
  spyOnDispatch = jest.spyOn(dispatcherFake, 'dispatch');

  fromSeed = await createUserAndAccount();
  fund = 100;
  const fundT = Transaction.create({
    delta: Amount.create({ value: fund }).value,
    balance: Amount.create({ value: fund }).value,
    description: Description.create({ value: `Test: ${chance.sentence()}` }).value,
    date: new Date(),
  }).value;
  await AccountRepo.createTransaction(fundT, fromSeed.account.id.toString());
  toSeed = await createUserAndAccount();
});

beforeEach(async () => {
  spyOnDispatch.mockClear();
});

afterAll(async () => {
  await deleteUsers([{ id: fromSeed.userId }, { id: toSeed.userId }]);
});

const context = {} as unknown as Context;
test('Domain event dispatcher calls distributeDomainEvents with the 2 transactions data that produces a transfer', async () => {
  transfer = new Transfer(AccountRepo, dispatcherFake, {}, fakeTransaction);

  const dto: Request = {
    fromUserId: fromSeed.userId,
    toUserId: toSeed.userId,
    quantity: 30,
    fromDescription: `Test: ${chance.sentence()}`,
    toDescription: `Test: ${chance.sentence()}`,
  };

  const response = (await transfer.execute(
    getEvent(dto),
    context
  )) as Envelope<Created>;

  expect(response).not.toMatchObject({
    errorMessage: expect.anything(),
    errorType: expect.anything(),
  });

  const intakeFrom = {
    aggregateId: expect.any(String),
    dateTimeOccurred: expect.any(Date),
    transaction: {
      id: expect.any(String),
      balance: fromSeed.account.balance().value + fund - dto.quantity,
      delta: -dto.quantity,
      date: expect.any(Date),
      description: dto.fromDescription,
    },
    type: 'TransactionCreatedEvent',
    version: 0,
  };
  const dispatcherIntakeFrom = expect.objectContaining(intakeFrom);
  expect(spyOnDispatch).toHaveBeenCalledWith(
    dispatcherIntakeFrom,
    distributeDomainEvents
  );
  const dispatcherIntakeTo = expect.objectContaining({
    ...intakeFrom,
    transaction: {
      id: expect.any(String),
      balance: toSeed.account.balance().value + dto.quantity,
      delta: dto.quantity,
      date: expect.any(Date),
      description: dto.toDescription,
    },
  });
  expect(spyOnDispatch).toHaveBeenCalledWith(
    dispatcherIntakeTo,
    distributeDomainEvents
  );
  expect(spyOnDispatch).toBeCalledTimes(2);
});

test(`distributeDomainEvents isn't called when saving to DB fails [transfer]`, async () => {
  transfer = new Transfer(
    new AccountRepoFake(),
    dispatcherFake,
    {},
    fakeTransaction
  );

  const dto: Request = {
    fromUserId: fromSeed.userId,
    toUserId: toSeed.userId,
    quantity: 30,
    fromDescription: 'THROW_WHEN_SAVE',
    toDescription: 'THROW_WHEN_SAVE',
  };

  try {
    await transfer.execute(getEvent(dto), context);
    // eslint-disable-next-line no-empty
  } catch {}

  expect(spyOnDispatch).toBeCalledTimes(0);
});
