import { GetAccountByUserId } from './GetAccountByUserId';
import { Request } from './GetAccountByUserIdDTO';
import { AccountRepoFake, UserId } from '../../repos/AccountRepoFake';
import { Context } from 'aws-lambda';
import {
  getAPIGatewayGETevent as getEvent,
} from '../../../../shared/utils/test';

let accountRepo, getAccountByUserId: GetAccountByUserId;
beforeAll(() => {
  accountRepo = new AccountRepoFake();
  getAccountByUserId = new GetAccountByUserId(
    accountRepo,
  );
});

const context = {} as unknown as Context;
it('gets an account', async () => {
  const validData: Request = {
    userId: UserId.GOOD,
  };

  const response = await getAccountByUserId.execute(
    getEvent(validData),
    context
  );

  expect(response.statusCode).toBe(200);
  const parsed = JSON.parse(response.body);
  expect(parsed.result.balance).toBe(100); // faked balance is 200
});

it(`fails when userId isn't defined`, async () => {
  const result = await getAccountByUserId.execute(
    getEvent({}),
    context
  );

  expect(result.statusCode).toBe(400);
  const parsed = JSON.parse(result.body)
  expect(parsed.errorType).toBe('GetAccountByUserIdErrors.UserIdNotDefined');
});
it(`fails when userId isn't a string`, async () => {
  const badData = {
    userId: 1,
  };

  const result = await getAccountByUserId.execute(
    getEvent(badData),
    context
  );

  expect(result.statusCode).toBe(400);
  const parsed = JSON.parse(result.body)
  expect(parsed.errorType).toBe('GetAccountByUserIdErrors.UserIdNotString');
});
it(`fails when userId isn't an uuid`, async () => {
  const badData = {
    userId: 'not a uuid',
  };

  const result = await getAccountByUserId.execute(
    getEvent(badData),
    context
  );

  expect(result.statusCode).toBe(400);
  const parsed = JSON.parse(result.body)
  expect(parsed.errorType).toBe('GetAccountByUserIdErrors.UserIdNotUuid');
});

it(`fails when account isn't found`, async () => {
  const validData: Request = {
    userId: UserId.NO_TRANSACTIONS,
  };

  const response = await getAccountByUserId.execute(
    getEvent(validData),
    context
  );

  expect(response.statusCode).toBe(400);
  const parsed = JSON.parse(response.body);
  expect(parsed.errorType).toBe('GetAccountByUserIdErrors.AccountNotFound');

});
