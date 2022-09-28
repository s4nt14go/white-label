import * as dotenv from 'dotenv';
dotenv.config();
import { NotifyFE } from './NotifyFE';
import { TransactionCreatedEvent } from '../../../accounts/domain/events/TransactionCreatedEvent';
import { FeService } from '../../services/fe/FeService';
import { AppSyncClient } from '../../../../shared/infra/appsync/AppSyncClient';
import { Transaction } from '../../../accounts/domain/Transaction';
import { Amount } from '../../../accounts/domain/Amount';
import { Description } from '../../../accounts/domain/Description';

test('Notification to FE', async () => {
  const appsyncClient = new AppSyncClient();
  const spy = jest
    .spyOn(appsyncClient, 'send')
    .mockImplementation(() => new Promise((resolve) => resolve(Object())));

  const feService = new FeService(appsyncClient);
  const useCase = new NotifyFE(feService);

  const accountId = 'test_accountId';
  const balance = 100;
  const delta = 20;
  const date = new Date();
  const description = 'test_description';

  const transaction = Transaction.create({
    balance: Amount.create({ value: balance }).value,
    delta: Amount.create({ value: delta }).value,
    date,
    description: Description.create({ value: description }).value,
  }).value;
  const event = new TransactionCreatedEvent(accountId, transaction);

  await useCase.execute(event);

  expect(spy).toHaveBeenCalledWith({
    query: expect.stringContaining('notifyTransactionCreated'),
    variables: {
      accountId,
      transaction: expect.objectContaining({
        id: expect.any(String),
        balance,
        delta,
        date,
        description,
      }),
    },
  });
});
