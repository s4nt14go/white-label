import { Transfer } from './Transfer';
import { AccountRepoFake, UserId } from '../../repos/AccountRepoFake';
import { Context } from 'aws-lambda';
import {
  fakeTransaction,
  getAPIGatewayPOSTevent as getEvent,
} from '../../../../shared/utils/test';
import Chance from 'chance';

const chance = new Chance();

let accountRepo, transfer: Transfer;
beforeAll(() => {
  accountRepo = new AccountRepoFake();
  transfer = new Transfer(accountRepo, fakeTransaction);
});

const context = {} as unknown as Context;
test('Transfer', async () => {
  const data = {
    fromUserId: UserId.GOOD,
    toUserId: UserId.GOOD,
    quantity: 100,  // Faked balance is 100
    fromDescription: `Test: ${chance.sentence()}`,
  };

  const result = await transfer.execute(
    getEvent(data),
    context
  );

  expect(result.statusCode).toBe(201);
});

test.each([
  ['fromUserId', 'TransferErrors.FromUserIdNotDefined'],
  ['toUserId', 'TransferErrors.ToUserIdNotDefined'],
  ['quantity', 'TransferErrors.QuantityInvalid'],
  ['fromDescription', 'TransferErrors.FromDescriptionInvalid'],
])(
  'Transfer without %s fails with %s',
  async (field: string, errorType: string) => {
    const badData = {
      fromUserId: chance.guid(),
      toUserId: chance.guid(),
      quantity: chance.floating({ fixed: 2 }),
      fromDescription: `Test: ${chance.sentence()}`,
    };
    delete badData[
      field as 'fromUserId' | 'toUserId' | 'quantity' | 'fromDescription'
    ];

    const result = await transfer.execute(getEvent(badData), context);

    expect(result.statusCode).toBe(400);
    const parsed = JSON.parse(result.body);
    expect(parsed.errorType).toBe(errorType);
  }
);
test.each([
  ['fromUserId', 'TransferErrors.FromUserIdNotString'],
  ['toUserId', 'TransferErrors.ToUserIdNotString'],
])(
  'Transfer with %s not a string fails with %s',
  async (field: string, errorType: string) => {
    const badData = {
      fromUserId: chance.guid(),
      toUserId: chance.guid(),
      quantity: chance.floating({ fixed: 2 }),
      fromDescription: `Test: ${chance.sentence()}`,
    };
    badData[field as 'fromUserId' | 'toUserId'] = 1 as unknown as string;

    const result = await transfer.execute(getEvent(badData), context);

    expect(result.statusCode).toBe(400);
    const parsed = JSON.parse(result.body);
    expect(parsed.errorType).toBe(errorType);
  }
);

test.each([
  ['fromUserId', 'TransferErrors.FromAccountNotFound'],
  ['toUserId', 'TransferErrors.ToAccountNotFound'],
])(
  'If account not found for %s, it fails with %s',
  async (field: string, errorType: string) => {
    const badData = {
      fromUserId: UserId.GOOD,
      toUserId: UserId.GOOD,
      quantity: chance.floating({ fixed: 2 }),
      fromDescription: `Test: ${chance.sentence()}`,
    };
    badData[field as 'fromUserId' | 'toUserId'] = UserId.NO_TRANSACTIONS;

    const result = await transfer.execute(getEvent(badData), context);

    expect(result.statusCode).toBe(400);
    const parsed = JSON.parse(result.body);
    expect(parsed.errorType).toBe(errorType);
  }
);

it('fails when quantity is greater than source/from balance', async () => {
  const data = {
    fromUserId: UserId.GOOD,
    toUserId: UserId.GOOD,
    quantity: 101,  // Faked balance is 100
    fromDescription: `Test: ${chance.sentence()}`,
  };

  const result = await transfer.execute(
    getEvent(data),
    context
  );

  expect(result.statusCode).toBe(400);
  const parsed = JSON.parse(result.body)
  expect(parsed.errorType).toBe('TransferErrors.InvalidTransfer');
});
it('fails when quantity is greater than destination/to balance', async () => {
  const data = {
    fromUserId: UserId.GOOD,
    toUserId: UserId.GOOD,
    quantity: -101,  // Faked balance is 100, this implies a transfer from toAccount to fromAccount
    fromDescription: `Test: ${chance.sentence()}`,
  };

  const result = await transfer.execute(
    getEvent(data),
    context
  );

  expect(result.statusCode).toBe(400);
  const parsed = JSON.parse(result.body)
  expect(parsed.errorType).toBe('TransferErrors.InvalidTransfer');
});