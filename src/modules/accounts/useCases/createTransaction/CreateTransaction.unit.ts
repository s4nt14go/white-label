import { CreateTransaction } from './CreateTransaction';
import { AccountRepoFake, UserId } from '../../repos/AccountRepoFake';
import { Context } from 'aws-lambda';
import {
  fakeTransaction,
  getAPIGatewayEvent,
} from '../../../../shared/utils/test';
import Chance from 'chance';

const chance = new Chance();

let accountRepo, createTransaction: CreateTransaction;
beforeAll(() => {
  accountRepo = new AccountRepoFake();
  createTransaction = new CreateTransaction(
    accountRepo,
    fakeTransaction
  );
});

const context = {} as unknown as Context;
it('creates a transaction', async () => {
  const validData = {
    userId: UserId.GOOD,
    description: `Test: ${chance.sentence()}`,
    delta: 30,
  };

  const result = await createTransaction.execute(
    getAPIGatewayEvent(validData),
    context
  );

  expect(result.statusCode).toBe(201);
});

test.each([
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

    const result = await createTransaction.execute(
      getAPIGatewayEvent(badData),
      context
    );

    expect(result.statusCode).toBe(400);
    const parsed = JSON.parse(result.body)
    expect(parsed.errorType).toBe(errorType);
  }
);

it('fails when delta subtracts more than balance', async () => {
  const data = {
    userId: UserId.GOOD,
    description: `Test: ${chance.sentence()}`,
    delta: -101, // faked balance is 100
  };

  const result = await createTransaction.execute(
    getAPIGatewayEvent(data),
    context
  );

  expect(result.statusCode).toBe(400);
  const parsed = JSON.parse(result.body)
  expect(parsed.errorType).toBe('CreateTransactionErrors.InvalidTransaction');
});

it('fails when no transactions are found for the user', async () => {
  const data = {
    userId: UserId.NO_TRANSACTIONS,
    description: `Test: ${chance.sentence()}`,
    delta: 30,
  };

  const result = await createTransaction.execute(
    getAPIGatewayEvent(data),
    context
  );

  expect(result.statusCode).toBe(400);
  const parsed = JSON.parse(result.body)
  expect(parsed.errorType).toBe('CreateTransactionErrors.AccountNotFound');
});

test('Internal server error when no transactions are found for the user', async () => {
  const data = {
    userId: UserId.TRANSACTIONS_WITHOUT_ACCOUNT,
    description: `Test: ${chance.sentence()}`,
    delta: 30,
  };

  const result = await createTransaction.execute(
    getAPIGatewayEvent(data),
    context
  );

  expect(result.statusCode).toBe(500);
  const parsed = JSON.parse(result.body)
  expect(parsed.errorType).toBe('UnexpectedError');
});
