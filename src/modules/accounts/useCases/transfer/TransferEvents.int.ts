import * as dotenv from 'dotenv';
dotenv.config();
import setHooks from '../../../../shared/infra/database/sequelize/hooks';
import { LambdaInvokerFake } from '../../../../shared/infra/invocation/LambdaInvokerFake';
import { Transfer } from './Transfer';
import { Response } from './TransferDTOs';
import { getAppSyncEvent as getEvent } from '../../../../shared/utils/test';
import {
  AccountRepo,
  createUserAndAccount,
  deleteUsers,
} from '../../../../shared/utils/repos';
import { DomainEventBase } from '../../../../shared/domain/events/DomainEventBase';
import { Envelope } from '../../../../shared/core/Envelope';
import { Account } from '../../domain/Account';
import { Request } from './TransferDTOs';
import { Transaction } from '../../domain/Transaction';
import { Amount } from '../../domain/Amount';
import { Description } from '../../domain/Description';
import Chance from 'chance';
import { AccountRepoFake } from '../../repos/AccountRepoFake';
import { IInvoker } from '../../../../shared/infra/invocation/LambdaInvoker';
import { User } from '../../../users/domain/User';

const chance = new Chance();

// Add all process.env used:
const { distributeDomainEvents } = process.env;
if (!distributeDomainEvents) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

let transfer: Transfer,
  invokerFake: IInvoker,
  spyOnInvoker: jest.SpyInstance<
    unknown,
    [event: DomainEventBase, handler: string]
  >;
type Seed = {
  user: User;
  account: Account;
}
let fromSeed: Seed, toSeed: Seed, fund: number, fromSeedUserId: string, toSeedUserId: string;
beforeAll(async () => {
  setHooks();
  invokerFake = new LambdaInvokerFake();
  spyOnInvoker = jest.spyOn(invokerFake, 'invoke');

  fromSeed = await createUserAndAccount();
  fromSeedUserId = fromSeed.user.id.toString();
  fund = 100;
  const fundT = Transaction.create({
    delta: Amount.create({ value: fund }).value,
    balance: Amount.create({ value: fund }).value,
    description: Description.create({ value: `Test: ${chance.sentence()}` }).value,
    date: new Date(),
  }).value;
  await AccountRepo.createTransaction(fundT, fromSeed.account.id.toString());
  toSeed = await createUserAndAccount();
  toSeedUserId = toSeed.user.id.toString();
});

beforeEach(async () => {
  spyOnInvoker.mockClear();
});

afterAll(async () => {
  await deleteUsers([{ id: fromSeedUserId }, { id: toSeedUserId }]);
});

test('Domain event dispatcher invokes distributeDomainEvents with the 2 transactions data that produces a transfer', async () => {
  transfer = new Transfer(AccountRepo, invokerFake);

  const dto: Request = {
    fromUserId: fromSeedUserId,
    toUserId: toSeedUserId,
    quantity: 30,
    fromDescription: `Test: ${chance.sentence()}`,
    toDescription: `Test: ${chance.sentence()}`,
  };

  const response = (await transfer.execute(
    getEvent(dto),
  )) as Envelope<Response>;

  expect(response).not.toMatchObject({
    errorMessage: expect.anything(),
    errorType: expect.anything(),
  });

  if (!response.result) {
    console.log('response', response);
    throw Error(`No result received`);
  }

  let accountId = fromSeed.account.id.toString();
  const intakeFrom = {
    aggregateId: accountId,
    dateTimeOccurred: expect.any(Date),
    transaction: {
      id: response.result.fromTransaction,
      balance: fromSeed.account.balance().value + fund - dto.quantity,
      delta: -dto.quantity,
      date: expect.any(Date),
      description: dto.fromDescription,
    },
    type: 'TransactionCreatedEvent',
    version: 0,
  };
  const invokerIntakeFrom = expect.objectContaining(intakeFrom);
  expect(spyOnInvoker).toHaveBeenCalledWith(
    invokerIntakeFrom,
    distributeDomainEvents
  );

  accountId = toSeed.account.id.toString();
  const invokerIntakeTo = expect.objectContaining({
    ...intakeFrom,
    aggregateId: accountId,
    transaction: {
      id: response.result.toTransaction,
      balance: toSeed.account.balance().value + dto.quantity,
      delta: dto.quantity,
      date: expect.any(Date),
      description: dto.toDescription,
    },
  });
  expect(spyOnInvoker).toHaveBeenCalledWith(
    invokerIntakeTo,
    distributeDomainEvents
  );
  expect(spyOnInvoker).toBeCalledTimes(2);
});

test(`distributeDomainEvents isn't called when saving to DB fails [transfer]`, async () => {
  transfer = new Transfer(new AccountRepoFake(), invokerFake);

  const dto: Request = {
    fromUserId: fromSeedUserId,
    toUserId: toSeedUserId,
    quantity: 30,
    fromDescription: 'THROW_WHEN_SAVE',
    toDescription: 'THROW_WHEN_SAVE',
  };

  try {
    await transfer.execute(getEvent(dto));
    // eslint-disable-next-line no-empty
  } catch {}

  expect(spyOnInvoker).toBeCalledTimes(0);
});
