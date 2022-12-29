import { NotifyFE } from './NotifyFE';
import { TransactionCreatedEvent } from '../../../accounts/domain/events/TransactionCreatedEvent';
import { FeService } from '../../services/fe/FeService';
process.env.appsyncUrl = process.env.appsyncKey = 'dummy';
import { AppSyncClient } from '../../../../shared/infra/appsync/AppSyncClient';
import { Transaction } from '../../../accounts/domain/Transaction';
import { Amount } from '../../../accounts/domain/Amount';
import { Description } from '../../../accounts/domain/Description';
import { NotificationTargets } from '../../domain/NotificationTargets';
import { NotificationTypes } from '../../domain/NotificationTypes';
import { dateFormat } from '../../../../shared/utils/test';

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
  const event = new TransactionCreatedEvent(accountId, transaction).toDTO();

  await useCase.execute(event);

  expect(spy).toHaveBeenCalledWith({
    query: expect.objectContaining({
      loc: expect.objectContaining({
        source: expect.objectContaining({
          body: expect.stringContaining('notifyTransactionCreated'),
        }),
      }),
    }),
    variables: {
      data: {
        accountId,
        target: NotificationTargets.FE,
        type: NotificationTypes.TransactionCreated,
        transaction: expect.objectContaining({
          id: expect.any(String),
          balance,
          delta,
          date: expect.stringMatching(dateFormat),
          description,
        }),
      },
    },
  });
});
