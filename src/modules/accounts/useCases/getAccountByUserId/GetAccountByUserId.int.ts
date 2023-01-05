import * as dotenv from 'dotenv';
dotenv.config();
import 'aws-testing-library/lib/jest';
import {
  getAppSyncEvent as getEvent,
  invokeLambda,
} from '../../../../shared/utils/test';
import {
  deleteUsers,
  AccountRepo,
  createUserAndAccount,
} from '../../../../shared/utils/repos';
import { Request } from './GetAccountByUserIdDTOs';
import { Account } from '../../domain/Account';
import { User } from '../../../users/domain/User';

// Add all process.env used:
const { getAccountByUserId, AWS_REGION } = process.env;
if (!getAccountByUserId || !AWS_REGION) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

let seed: { user: User, account: Account }, seedUserId : string;
beforeAll(async () => {
  seed = await createUserAndAccount();
  seedUserId = seed.user.id.toString();
});

afterAll(async () => {
  await deleteUsers([{ id: seedUserId }]);
});

it('gets an account & uses cache for a second query', async () => {
  // get an account
  const dto: Request = {
    userId: seedUserId,
  };
  const invoked = await invokeLambda(getEvent(dto), getAccountByUserId);

  expect(invoked.result.balance).toBe(0);

  const account = await AccountRepo.getAccountByUserId(seedUserId);
  if (!account) throw new Error(`Account not found for userId ${seedUserId}`);
  expect(account.transactions.length).toBe(1); // Initial transaction when seeding
  expect(account.transactions[0].balance.value).toBe(0);

  // use cache for a second query
  await invokeLambda(getEvent(dto), getAccountByUserId);

  if (!process.env.IS_LOCAL) {
    await expect({
      region: AWS_REGION,
      function: getAccountByUserId,
      timeout: 12000,
    }).toHaveLog(
      `Response for userId ${dto.userId} taken from cache`
    );
  } else console.log(`CloudWatch logs aren't written when SST is running locally`);
});
