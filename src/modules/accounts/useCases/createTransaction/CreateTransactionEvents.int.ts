import * as dotenv from 'dotenv';
dotenv.config();
import setHooks from '../../../../shared/infra/database/sequelize/hooks';
import { LambdaInvokerFake } from '../../../../shared/infra/invocation/LambdaInvokerFake';
import { CreateTransaction } from './CreateTransaction';
import {
  dateFormat,
  getAppSyncEvent as getEvent,
} from '../../../../shared/utils/test';
import {
  AccountRepo,
  createUserAndAccount,
  deleteUsers,
} from '../../../../shared/utils/repos';
import { DomainEventBase } from '../../../../shared/domain/events/DomainEventBase';
import { Envelope } from '../../../../shared/core/Envelope';
import { Created } from '../../../../shared/core/Created';
import { Account } from '../../domain/Account';
import { Request as CreateTransactionDTOreq } from './CreateTransactionDTOs';
import { AccountRepoFake } from '../../repos/AccountRepoFake';
import { IInvoker } from '../../../../shared/infra/invocation/LambdaInvoker';
import { User } from '../../../users/domain/User';

// Add all process.env used:
const { distributeDomainEvents } = process.env;
if (!distributeDomainEvents) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

let seed: { user: User, account: Account }, seedUserId : string;
let createTransaction: CreateTransaction,
  invokerFake: IInvoker,
  spyOnInvoker: jest.SpyInstance<
    unknown,
    [event: DomainEventBase, handler: string]
  >;
beforeAll(async () => {
  setHooks();
  invokerFake = new LambdaInvokerFake();
  spyOnInvoker = jest.spyOn(invokerFake, 'invoke');
  seed = await createUserAndAccount();
  seedUserId = seed.user.id.toString();
});

beforeEach(async () => {
  spyOnInvoker.mockClear();
});

afterAll(async () => {
  await deleteUsers([{ id: seedUserId }]);
});

test('Domain event dispatcher invokes distributeDomainEvents with transaction data for TransactionCreatedEvent', async () => {
  createTransaction = new CreateTransaction(AccountRepo, invokerFake);

  const newTransaction: CreateTransactionDTOreq = {
    userId: seedUserId,
    description: 'Test CreateTransactionEvents.int.ts',
    delta: 55,
  };

  const response = (await createTransaction.execute(
    getEvent(newTransaction)
  )) as Envelope<Created>;

  expect(response).toMatchObject({
    time: expect.stringMatching(dateFormat),
    result: {
      id: expect.any(String),
    },
  });

  if (!response.result) throw 'Undefined result';

  const invokerIntake = expect.objectContaining({
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
  expect(spyOnInvoker).toHaveBeenCalledWith(invokerIntake, distributeDomainEvents);
  expect(spyOnInvoker).toBeCalledTimes(1);
});

test(`distributeDomainEvents isn't called when saving to DB fails [createTransaction]`, async () => {
  createTransaction = new CreateTransaction(new AccountRepoFake(), invokerFake);

  const newTransaction: CreateTransactionDTOreq = {
    userId: seedUserId,
    description: 'THROW_WHEN_SAVE',
    delta: 55,
  };

  try {
    await createTransaction.execute(getEvent(newTransaction));
    // eslint-disable-next-line no-empty
  } catch {}

  expect(spyOnInvoker).toBeCalledTimes(0);
});
