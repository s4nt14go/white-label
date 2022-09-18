import * as dotenv from 'dotenv';
dotenv.config();
import { getAppSyncEvent as getEvent, invokeLambda } from '../../../../shared/utils/test';
import {
  deleteUsers,
  AccountRepo,
  createUserAndAccount,
} from '../../../../shared/utils/repos';
import { Request } from './GetAccountByUserIdDTO';
import { Account } from '../../domain/Account';

// Add all process.env used:
const { getAccountByUserId } = process.env;
if (!getAccountByUserId) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

let seed: { userId: string; account: Account };
beforeAll(async () => {
  seed = await createUserAndAccount();
});

afterAll(async () => {
  await AccountRepo.deleteByUserId(seed.userId);
  await deleteUsers([{ id: seed.userId }]);
});

it('gets an account', async () => {
  const dto: Request = {
    userId: seed.userId,
  };
  const invoked = await invokeLambda(getEvent(dto), getAccountByUserId);

  expect(invoked.result.balance).toBe(0);

  const account = await AccountRepo.getAccountByUserId(seed.userId);
  if (!account) throw new Error(`Account not found for userId ${seed.userId}`);
  expect(account.transactions.length).toBe(1); // Initial transaction when seeding
  expect(account.transactions[0].balance.value).toBe(0);
});
