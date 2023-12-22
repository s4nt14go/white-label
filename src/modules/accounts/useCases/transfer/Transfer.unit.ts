process.env.distributeDomainEvents = 'dummy';
import { Transfer } from './Transfer';
import { AccountRepoFake, UserId } from '../../repos/AccountRepoFake';
import {
  dateFormat,
  getAppSyncEvent as getEvent,
} from '../../../../shared/utils/test';
import Chance from 'chance';
import { LambdaInvokerFake } from '../../../../shared/infra/invocation/LambdaInvokerFake';

const chance = new Chance();

let accountRepo, transfer: Transfer;
beforeAll(() => {
  accountRepo = new AccountRepoFake();
  transfer = new Transfer(accountRepo, new LambdaInvokerFake());
});

test('Transfer', async () => {
  const data = {
    fromUserId: UserId.GOOD,
    toUserId: UserId.GOOD2,
    quantity: 100, // Faked balance is 100 so we can't transfer more than that
    fromDescription: `Test: ${chance.sentence()}`,
  };

  const result = await transfer.execute(getEvent(data));

  expect(result).toMatchObject({
    time: expect.stringMatching(dateFormat),
    result: {
      fromTransaction: expect.any(String),
      toTransaction: expect.any(String),
    },
  });
  expect(result).not.toMatchObject({
    error: expect.anything(),
  });
});

it('fails when quantity is greater than source/from balance', async () => {
  const data = {
    fromUserId: UserId.GOOD,
    toUserId: UserId.GOOD2,
    quantity: 101, // Faked balance is 100
    fromDescription: `Test: ${chance.sentence()}`,
  };

  const result = await transfer.execute(getEvent(data));

  expect(result).toMatchObject({
    errorType: 'TransferErrors.InvalidTransfer',
  });
});
it('fails when quantity is greater than destination/to balance', async () => {
  const data = {
    fromUserId: UserId.GOOD,
    toUserId: UserId.GOOD2,
    quantity: -101, // Faked balance is 100, this implies a transfer from toAccount to fromAccount
    fromDescription: `Test: ${chance.sentence()}`,
  };

  const result = await transfer.execute(getEvent(data));

  expect(result).toMatchObject({
    errorType: 'TransferErrors.InvalidTransfer',
  });
});
it('fails when source/from and destination/to accounts are the same', async () => {
  const data = {
    fromUserId: UserId.GOOD,
    toUserId: UserId.GOOD,
    quantity: 100, // Faked balance is 100
    fromDescription: `Test: ${chance.sentence()}`,
  };

  const result = await transfer.execute(getEvent(data));

  expect(result).toMatchObject({
    errorType: 'TransferErrors.SameFromAndTo',
  });
});
