import { ReturnUnexpectedError } from '../../../../shared/decorators/ReturnUnexpectedError';
process.env.distributeDomainEvents = 'dummy';
import { CreateTransaction } from './CreateTransaction';
import { AccountRepoFake, UserId } from '../../repos/AccountRepoFake';
import {
  dateFormat,
  getAppSyncEvent as getEvent,
} from '../../../../shared/utils/test';
import Chance from 'chance';
import { LambdaInvokerFake } from '../../../../shared/infra/invocation/LambdaInvokerFake';
import { Transaction } from '../../../../shared/decorators/Transaction';

const chance = new Chance();

let accountRepo: AccountRepoFake, controller: CreateTransaction;
beforeAll(() => {
  accountRepo = new AccountRepoFake();
  controller = new CreateTransaction(accountRepo, new LambdaInvokerFake());
});

it('creates a transaction', async () => {
  const validData = {
    userId: UserId.GOOD,
    description: `Test: ${chance.sentence()}`,
    delta: 30,
  };

  const result = await controller.execute(getEvent(validData));

  expect(result).toMatchObject({
    result: {
      id: expect.any(String),
    },
    time: expect.stringMatching(dateFormat),
  });
  expect(result).not.toMatchObject({
    error: expect.anything(),
  });
});

test.each([
  ['userId', 'CreateTransactionErrors.UserIdNotDefined'],
  ['description', 'CreateTransactionErrors.InvalidDescription'],
  ['delta', 'CreateTransactionErrors.InvalidDelta'],
])(
  'Transaction creation without %s fails with %s',
  async (field: string, errorType: string) => {
    const badData = {
      userId: UserId.GOOD,
      description: `Test: ${chance.sentence()}`,
      delta: 30,
    };
    delete badData[field as 'description' | 'delta'];

    const result = await controller.execute(getEvent(badData));

    expect(result).toMatchObject({
      errorType,
    });
  }
);
it(`fails when userId isn't a string`, async () => {
  const badData = {
    userId: 1,
    description: `Test: ${chance.sentence()}`,
    delta: 30,
  };

  const result = await controller.execute(getEvent(badData));

  expect(result).toMatchObject({
    errorType: 'CreateTransactionErrors.UserIdNotString',
  });
});
it(`fails when userId isn't an uuid`, async () => {
  const badData = {
    userId: 'not an uuid',
    description: `Test: ${chance.sentence()}`,
    delta: 30,
  };

  const result = await controller.execute(getEvent(badData));

  expect(result).toMatchObject({
    errorType: 'CreateTransactionErrors.UserIdNotUuid',
  });
});

it('fails when delta subtracts more than balance', async () => {
  const data = {
    userId: UserId.GOOD,
    description: `Test: ${chance.sentence()}`,
    delta: -101, // faked balance is 100
  };

  const result = await controller.execute(getEvent(data));

  expect(result).toMatchObject({
    errorType: 'CreateTransactionErrors.InvalidTransaction',
  });
});

it('fails when no transactions are found for the user', async () => {
  const data = {
    userId: UserId.NO_TRANSACTIONS,
    description: `Test: ${chance.sentence()}`,
    delta: 30,
  };

  const result = await controller.execute(getEvent(data));

  expect(result).toMatchObject({
    errorType: 'CreateTransactionErrors.AccountNotFound',
  });
});

test('Internal server error when no transactions are found for the user', async () => {
  const data = {
    userId: UserId.TRANSACTIONS_WITHOUT_ACCOUNT,
    description: `Test: ${chance.sentence()}`,
    delta: 30,
  };

  const decorated1 = new Transaction(controller, Object(), [accountRepo]);
  const decorated2 = new ReturnUnexpectedError(decorated1);
  const result = await decorated2.execute(getEvent(data), Object());

  expect(result).toMatchObject({
    errorType: 'UnexpectedError',
  });
});
