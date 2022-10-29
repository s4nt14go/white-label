import { getAppsyncInput, invokeVtl } from '../../../utils/test';
import path from 'path';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import { NotificationTypes } from '../../../../modules/notification/domain/NotificationTypes';
import { NotificationTargets } from '../../../../modules/notification/domain/NotificationTargets';

it('request template flattens transaction', () => {
  const templatePath = path.resolve(
    __dirname,
    './Mutation.notifyTransactionCreated.request.vtl'
  );

  const args = {
    data: {
      target: NotificationTargets.FE,
      type: NotificationTypes.TransactionCreated,
      accountId: '$accountId',
      transaction: {
        balance: 100,
        date: new Date(),
        delta: 20,
        description: '$description',
        id: '$id',
      },
    },
  };
  const input = getAppsyncInput({}, args);
  const result = invokeVtl(templatePath, input);

  result.key = DynamoDB.Converter.unmarshall(result.key);
  result.attributeValues = DynamoDB.Converter.unmarshall(result.attributeValues);

  const {
    accountId,
    target,
    type,
    transaction: { id, balance, delta, date, description },
  } = args.data;

  expect(result).toMatchObject({
    operation: 'PutItem',
    key: expect.objectContaining({
      type,
      accountId,
      id,
    }),
    attributeValues: expect.objectContaining({
      target,
      balance,
      delta,
      date: date.toJSON(), // Dates as saved as strings in DDB
      description,
    }),
  });
});

it('response template reconstructs transaction object', () => {
  const templatePath = path.resolve(
    __dirname,
    './Mutation.notifyTransactionCreated.response.vtl'
  );

  const input = getAppsyncInput({
    target: '$target',
    type: '$type',
    accountId: '$accountId',
    balance: 100,
    date: new Date(),
    delta: 20,
    description: '$description',
    id: '$id',
  });
  const result = invokeVtl(templatePath, input);

  const { type, accountId, target, id, balance, delta, date, description } =
    input.ctx.result;

  expect(result).toMatchObject({
    type,
    accountId,
    target,
    transaction: expect.objectContaining({
      id,
      balance,
      delta,
      date: date.toJSON(), // Dates as saved as strings in DDB
      description,
    }),
  });
});
