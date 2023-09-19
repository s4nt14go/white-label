import { Context, util } from '@aws-appsync/utils';
import {
  NotifyTransactionCreatedInput,
  TransactionCreatedNotification,
} from '../schema.graphql';

export type TArgs = {
  data: NotifyTransactionCreatedInput;
};
export type TResult = {
  // Keys
  type: string;
  accountId: string;
  id: string;
  // Attributes
  target: {
    S: string;
  };
  date: {
    S: string;
  };
  balance: {
    N: number;
  };
  delta: {
    N: number;
  };
  description: {
    S: string;
  };
};

export function request(ctx: Context<TArgs>) {
  return {
    operation: 'PutItem',
    key: {
      type: util.dynamodb.toDynamoDB(ctx.args.data.type),
      accountId: util.dynamodb.toDynamoDB(ctx.args.data.accountId),
      id: util.dynamodb.toDynamoDB(ctx.args.data.transaction.id),
    },
    attributeValues: util.dynamodb.toMapValues({
      target: util.dynamodb.toDynamoDB(ctx.args.data.target),
      balance: util.dynamodb.toDynamoDB(ctx.args.data.transaction.balance),
      delta: util.dynamodb.toDynamoDB(ctx.args.data.transaction.delta),
      date: util.dynamodb.toDynamoDB(ctx.args.data.transaction.date),
      description: util.dynamodb.toDynamoDB(ctx.args.data.transaction.description),
    }),
    condition: {
      expression: 'attribute_not_exists(id)',
    },
  };
}

export function response(
  ctx: Context<TArgs, object, object, object, TResult>
): TransactionCreatedNotification {

  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }
  const {
    // Top-level TransactionCreatedNotification fields
    type,
    target: { S: target },
    accountId,
    // TransactionCreatedNotification.transaction fields
    id,
    balance: { N: balance },
    delta: { N: delta },
    date: { S: date },
    description: { S: description },
  } = ctx.result;

  return {
    type,
    target,
    accountId,
    transaction: { id, balance, delta, date, description },
  };
}
