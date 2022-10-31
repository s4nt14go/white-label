import * as dotenv from 'dotenv';
dotenv.config();
import setHooks from '../../../../shared/infra/database/sequelize/hooks';
import { DispatcherFake } from '../../../../shared/infra/dispatchEvents/DispatcherFake';
import { CreateTransaction } from './CreateTransaction';
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
import { Request as CreateTransactionDTOreq } from './CreateTransactionDTO';
import { AccountRepoFake } from '../../repos/AccountRepoFake';

// Add all process.env used:
const { distributeDomainEvents } = process.env;
if (!distributeDomainEvents) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

let seed: { userId: string; account: Account };
let createTransaction: CreateTransaction,
  dispatcherFake: IDispatcher,
  spyOnDispatch: jest.SpyInstance<void, [event: DomainEventBase, handler: string]>;
beforeAll(async () => {
  setHooks();
  dispatcherFake = new DispatcherFake();
  spyOnDispatch = jest.spyOn(dispatcherFake, 'dispatch');
  seed = await createUserAndAccount();
});

beforeEach(async () => {
  spyOnDispatch.mockClear();
});

afterAll(async () => {
  await deleteUsers([{ id: seed.userId }]);
});

const context = {} as unknown as Context;
test('Domain event dispatcher calls distributeDomainEvents with transaction data for TransactionCreatedEvent', async () => {
  createTransaction = new CreateTransaction(
    AccountRepo,
    dispatcherFake,
    {},
    fakeTransaction
  );

  const newTransaction: CreateTransactionDTOreq = {
    userId: seed.userId,
    description: 'Test CreateTransactionEvents.int.ts',
    delta: 55,
  };

  const response = (await createTransaction.execute(
    getEvent(newTransaction),
    context
  )) as Envelope<Created>;

  expect(response).toMatchObject({
    time: expect.any(String),
    result: {
      id: expect.any(String),
    },
  });

  if (!response.result) throw 'Undefined result';

  const dispatcherIntake = expect.objectContaining({
    aggregateId: expect.any(String),
    dateTimeOccurred: expect.any(Date),
    transaction: {
      id: response.result.id,
      balance: seed.account.balance().value + newTransaction.delta,
      delta: newTransaction.delta,
      date: expect.any(Date),
      description: newTransaction.description,
    },
    type: 'TransactionCreatedEvent',
    version: 0,
  });
  expect(spyOnDispatch).toHaveBeenCalledWith(
    dispatcherIntake,
    distributeDomainEvents
  );
  expect(spyOnDispatch).toBeCalledTimes(1);
});

test(`distributeDomainEvents isn't called when saving to DB fails [createTransaction]`, async () => {
  createTransaction = new CreateTransaction(
    new AccountRepoFake(),
    dispatcherFake,
    {},
    fakeTransaction
  );

  const newTransaction: CreateTransactionDTOreq = {
    userId: seed.userId,
    description: 'THROW_WHEN_SAVE',
    delta: 55,
  };

  try {
    await createTransaction.execute(getEvent(newTransaction), context);
    // eslint-disable-next-line no-empty
  } catch {}

  expect(spyOnDispatch).toBeCalledTimes(0);
});
