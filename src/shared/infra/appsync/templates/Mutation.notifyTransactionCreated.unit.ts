import { getAppsyncCtx } from '../../../utils/test';
import { NotificationTypes } from '../../../../modules/notification/domain/NotificationTypes';
import { NotificationTargets } from '../../../../modules/notification/domain/NotificationTargets';
import * as notifyTransactionCreated from './Mutation.notifyTransactionCreated';
import { util } from '@aws-appsync/utils';
import * as utilDDB from './util.dynamodb';
import { TArgs, TResult } from './Mutation.notifyTransactionCreated';
import { DynamodbUtil } from '@aws-appsync/utils/lib/dynamodb-utils';
const { request, response } = notifyTransactionCreated;

util.dynamodb = utilDDB as unknown as DynamodbUtil;

const args = {
  data: {
    target: NotificationTargets.FE.toString(),
    type: NotificationTypes.TransactionCreated.toString(),
    accountId: '$accountId',
    transaction: {
      balance: 100,
      date: new Date().toJSON(),
      delta: 20,
      description: '$description',
      id: '$id',
    },
  },
};

test('request function sends DDB PutItem operation', () => {
  const input = getAppsyncCtx<TArgs, null>(args, null);

  const result = request(input);

  const {
    accountId,
    target,
    type,
    transaction: { id, balance, delta, date, description },
  } = args.data;

  expect(result).toMatchObject({
    operation: 'PutItem',
    key: expect.objectContaining({
      type: { S: type },
      accountId: { S: accountId },
      id: { S: id },
    }),
    attributeValues: expect.objectContaining({
      target: { M: { S: { S: target } } },
      balance: { M: { N: { N: balance } } },
      delta: { M: { N: { N: delta } } },
      date: { M: { S: { S: date } } },
      description: { M: { S: { S: description } } },
    }),
    condition: expect.objectContaining({
      expression: 'attribute_not_exists(id)',
    }),
  });
});

test('response function gathers together transaction data', () => {
  const ctxResult = {
    // Keys
    type: '$type',
    accountId: '$accountId',
    id: '$id',
    // Attributes
    date: {
      S: new Date().toJSON(),
    },
    balance: {
      N: 20,
    },
    delta: {
      N: 10,
    },
    description: {
      S: '$description',
    },
    target: {
      S: '$target',
    },
  };
  const input = getAppsyncCtx<TArgs, TResult>(args, ctxResult);
  const result = response(input);

  const {
    type,
    accountId,
    id,
    target: { S: target },
    balance: { N: balance },
    delta: { N: delta },
    date: { S: date },
    description: { S: description },
  } = ctxResult;

  expect(result).toMatchObject({
    type,
    accountId,
    target,
    transaction: expect.objectContaining({
      id,
      balance,
      delta,
      date,
      description,
    }),
  });
});
