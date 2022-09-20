import { CreateTransaction } from './CreateTransaction';
import { AccountRepoFake, UserId } from '../../repos/AccountRepoFake';
import { Context } from 'aws-lambda';
import {
  fakeTransaction,
  getAppSyncEvent as getEvent,
} from '../../../../shared/utils/test';
import Chance from 'chance';

const chance = new Chance();

let accountRepo, createTransaction: CreateTransaction;
beforeAll(() => {
  accountRepo = new AccountRepoFake();
  createTransaction = new CreateTransaction(accountRepo, {}, fakeTransaction);
});

const context = {} as unknown as Context;
it('creates a transaction', async () => {
  const validData = {
    userId: UserId.GOOD,
    description: `Test: ${chance.sentence()}`,
    delta: 30,
  };

  const result = await createTransaction.execute(
    getEvent(validData),
    context
  );

  expect(result).toMatchObject({
    time: expect.any(String),
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

    const result = await createTransaction.execute(getEvent(badData), context);

    expect(result).toMatchObject({
      error: {
        errorType,
      },
    });
  }
);
it(`fails when userId isn't a string`, async () => {
  const badData = {
    userId: 1,
    description: `Test: ${chance.sentence()}`,
    delta: 30,
  };

  const result = await createTransaction.execute(
    getEvent(badData),
    context
  );

  expect(result).toMatchObject({
    error: {
      errorType: 'CreateTransactionErrors.UserIdNotString',
    },
  });
});
it(`fails when userId isn't an uuid`, async () => {
  const badData = {
    userId: 'not an uuid',
    description: `Test: ${chance.sentence()}`,
    delta: 30,
  };

  const result = await createTransaction.execute(
    getEvent(badData),
    context
  );

  expect(result).toMatchObject({
    error: {
      errorType: 'CreateTransactionErrors.UserIdNotUuid',
    },
  });
});

it('fails when delta subtracts more than balance', async () => {
  const data = {
    userId: UserId.GOOD,
    description: `Test: ${chance.sentence()}`,
    delta: -101, // faked balance is 100
  };

  const result = await createTransaction.execute(
    getEvent(data),
    context
  );

  expect(result).toMatchObject({
    error: {
      errorType: 'CreateTransactionErrors.InvalidTransaction',
    },
  });
});

it('fails when no transactions are found for the user', async () => {
  const data = {
    userId: UserId.NO_TRANSACTIONS,
    description: `Test: ${chance.sentence()}`,
    delta: 30,
  };

  const result = await createTransaction.execute(
    getEvent(data),
    context
  );

  expect(result).toMatchObject({
    error: {
      errorType: 'CreateTransactionErrors.AccountNotFound',
    },
  });
});

test('Internal server error when no transactions are found for the user', async () => {
  const data = {
    userId: UserId.TRANSACTIONS_WITHOUT_ACCOUNT,
    description: `Test: ${chance.sentence()}`,
    delta: 30,
  };

  const result = await createTransaction.execute(
    getEvent(data),
    context
  );

  expect(result).toMatchObject({
    error: {
      errorType: 'UnexpectedError',
    },
  });
});
