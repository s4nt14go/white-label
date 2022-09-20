import { GetAccountByUserId } from './GetAccountByUserId';
import { Request, Response } from './GetAccountByUserIdDTO';
import { AccountRepoFake, UserId } from '../../repos/AccountRepoFake';
import { Context } from 'aws-lambda';
import { getAppSyncEvent as getEvent } from '../../../../shared/utils/test';
import { Envelope } from '../../../../shared/core/Envelope';
import { BaseError } from '../../../../shared/core/AppError';

let accountRepo, getAccountByUserId: GetAccountByUserId;
beforeAll(() => {
  accountRepo = new AccountRepoFake();
  getAccountByUserId = new GetAccountByUserId(accountRepo, {});
});

const context = {} as unknown as Context;
it('gets an account', async () => {
  const validData: Request = {
    userId: UserId.GOOD,
  };

  const response = (await getAccountByUserId.execute(
    getEvent(validData),
    context
  )) as Envelope<Response>;

  expect(response.result?.balance).toBe(100); // faked balance is 100
});

it(`fails when userId isn't defined`, async () => {
  const result = (await getAccountByUserId.execute(getEvent({}), context)) as {
    error: Envelope<BaseError>;
  };

  expect(result.error.errorType).toBe('GetAccountByUserIdErrors.UserIdNotDefined');
});
it(`fails when userId isn't a string`, async () => {
  const badData = {
    userId: 1,
  };

  const result = (await getAccountByUserId.execute(
    getEvent(badData),
    context
  )) as { error: Envelope<BaseError> };

  expect(result.error.errorType).toBe('GetAccountByUserIdErrors.UserIdNotString');
});
it(`fails when userId isn't an uuid`, async () => {
  const badData = {
    userId: 'not a uuid',
  };

  const result = (await getAccountByUserId.execute(
    getEvent(badData),
    context
  )) as { error: Envelope<BaseError> };

  expect(result.error.errorType).toBe('GetAccountByUserIdErrors.UserIdNotUuid');
});

it(`fails when account isn't found`, async () => {
  const validData: Request = {
    userId: UserId.NO_TRANSACTIONS,
  };

  const response = (await getAccountByUserId.execute(
    getEvent(validData),
    context
  )) as { error: Envelope<BaseError> };

  expect(response.error.errorType).toBe(
    'GetAccountByUserIdErrors.AccountNotFound'
  );
});
