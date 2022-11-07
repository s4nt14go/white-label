import { StackContext, Function, AppSyncApi } from '@serverless-stack/resources';
import * as cdk from 'aws-cdk-lib';
import * as appsync from '@aws-cdk/aws-appsync-alpha';
import { SSM } from 'aws-sdk';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Table } from '@serverless-stack/resources';

export async function MyStack({ stack, app }: StackContext) {
  const ssm = new SSM();
  const ssmGetResponse = await ssm
    .getParameter({ Name: `/${app.name}/${app.stage}/cockroach` })
    .promise();
  if (
    !ssmGetResponse ||
    !ssmGetResponse.Parameter ||
    !ssmGetResponse.Parameter.Value
  ) {
    throw Error('No data found in SSM');
  }
  const cockroach = ssmGetResponse.Parameter.Value;
  const [username, password, database, host, dialect, port, cluster] =
    cockroach.split(',');
  const dbCreds = {
    COCKROACH_username: username,
    COCKROACH_password: password,
    COCKROACH_database: database,
    COCKROACH_host: host,
    COCKROACH_dialect: dialect,
    COCKROACH_port: port,
    COCKROACH_cluster: cluster,
  };

  const distributeDomainEvents = new Function(stack, 'distributeDomainEvents', {
    handler: 'shared/infra/dispatchEvents/DistributeDomainEvents.handler',
  });
  allowAutoInvoke(distributeDomainEvents);

  const notifySlackChannel = new Function(stack, 'notifySlackChannel', {
    handler: 'modules/notification/useCases/notifySlackChannel/index.handler',
  });
  allowAutoInvoke(notifySlackChannel);
  notifySlackChannel.grantInvoke(distributeDomainEvents);
  distributeDomainEvents.addEnvironment(
    'notifySlackChannel',
    notifySlackChannel.functionName
  );

  const someWork = new Function(stack, 'someWork', {
    handler: 'modules/users/useCases/someWork/index.handler',
  });
  allowAutoInvoke(someWork);
  someWork.grantInvoke(distributeDomainEvents);
  distributeDomainEvents.addEnvironment('someWork', someWork.functionName);

  const createAccount = new Function(stack, 'createAccount', {
    handler: 'modules/accounts/useCases/createAccount/index.handler',
    environment: dbCreds,
  });
  allowAutoInvoke(createAccount);
  createAccount.grantInvoke(distributeDomainEvents);
  distributeDomainEvents.addEnvironment(
    'createAccount',
    createAccount.functionName
  );

  const createUser = new Function(stack, 'createUser', {
    handler: 'modules/users/useCases/createUser/index.handler',
    environment: {
      ...dbCreds,
      distributeDomainEvents: distributeDomainEvents.functionName,
    },
  });
  allowAutoInvoke(createUser);
  distributeDomainEvents.grantInvoke(createUser);

  const createTransaction = new Function(stack, 'createTransaction', {
    handler: 'modules/accounts/useCases/createTransaction/index.handler',
    environment: {
      ...dbCreds,
      distributeDomainEvents: distributeDomainEvents.functionName,
    },
  });
  allowAutoInvoke(createTransaction);
  distributeDomainEvents.grantInvoke(createTransaction);

  const transfer = new Function(stack, 'transfer', {
    handler: 'modules/accounts/useCases/transfer/index.handler',
    environment: {
      ...dbCreds,
      distributeDomainEvents: distributeDomainEvents.functionName,
    },
  });
  allowAutoInvoke(transfer);
  distributeDomainEvents.grantInvoke(transfer);

  const getAccountByUserId = new Function(stack, 'getAccountByUserId', {
    handler: 'modules/accounts/useCases/getAccountByUserId/index.handler',
    environment: dbCreds,
  });
  allowAutoInvoke(getAccountByUserId);

  const adaptResult = {
    file: 'src/shared/infra/appsync/templates/adaptResult.vtl',
  };
  const notificationsTable = new Table(stack, 'Notifications', {
    fields: {
      target: 'string', // e.g. FE
      type: 'string', // e.g. TransactionCreated
      accountId: 'string',
      id: 'string', // for TransactionCreated type, id is the transaction id
      balance: 'number',
      delta: 'number',
      date: 'string',
      description: 'string',
    },
    primaryIndex: { partitionKey: 'type', sortKey: 'id' },
    localIndexes: {
      byAccountId: { sortKey: 'accountId' },
    },
  });
  const api = new AppSyncApi(stack, 'AppSyncApi', {
    schema: 'src/shared/infra/appsync/schema.graphql',
    cdk: {
      graphqlApi: {
        authorizationConfig: {
          defaultAuthorization: {
            authorizationType: appsync.AuthorizationType.API_KEY,
            apiKeyConfig: {
              expires: cdk.Expiration.after(cdk.Duration.days(365)),
            },
          },
        },
      },
    },
    dataSources: {
      getAccountByUserId,
      createTransaction,
      transfer,
      createUser,
      none: { type: 'none' },
      notificationsTable: {
        type: 'dynamodb',
        table: notificationsTable,
      },
    },
    resolvers: {
      'Query getAccountByUserId': {
        dataSource: 'getAccountByUserId',
        responseMapping: adaptResult,
      },
      'Mutation createTransaction': {
        dataSource: 'createTransaction',
        responseMapping: adaptResult,
      },
      'Mutation transfer': {
        dataSource: 'transfer',
        responseMapping: adaptResult,
      },
      'Mutation createUser': {
        dataSource: 'createUser',
        responseMapping: adaptResult,
      },
      'Mutation notifyTransactionCreated': {
        dataSource: 'notificationsTable',
        requestMapping: {
          file: 'src/shared/infra/appsync/templates/Mutation.notifyTransactionCreated.request.vtl',
        },
        responseMapping: {
          file: 'src/shared/infra/appsync/templates/Mutation.notifyTransactionCreated.response.vtl',
        },
      },
      'Subscription onNotifyTransactionCreated': {
        dataSource: 'none',
        requestMapping: {
          inline: '#return',
        },
        responseMapping: {
          inline: '$util.toJson($ctx.result)',
        },
      },
    },
  });

  if (!api.cdk.graphqlApi.apiKey) {
    console.log('api.cdk', api.cdk);
    throw Error(`apiKey undefined`);
  }

  const notifyFE = new Function(stack, 'notifyFE', {
    handler: 'modules/notification/useCases/notifyFE/index.handler',
    environment: {
      appsyncKey: api.cdk.graphqlApi.apiKey,
      appsyncUrl: api.url,
    },
  });
  allowAutoInvoke(notifyFE);
  distributeDomainEvents.addEnvironment('notifyFE', notifyFE.functionName);
  notifyFE.grantInvoke(distributeDomainEvents);

  const storageTable = new Table(stack, 'Storage', {
    fields: {
      // Keys
      type: 'string', // UserCreatedEventStored | TransactionCreatedEventStored
      aggregateId: 'string', // User.id | Account.id
      typeAggregateId: 'string', // <type>#<aggregateId>
      dateTimeOccurred: 'string',

      // UserCreatedEventStored
      username: 'string',
      email: 'string',
      // TransactionCreatedEventStored
      id: 'string', // Transaction.id
      balance: 'number',
      delta: 'number',
      date: 'string',
      description: 'string',

      version: 'number',
    },
    primaryIndex: { partitionKey: 'typeAggregateId', sortKey: 'dateTimeOccurred' },
    globalIndexes: {
      byDate: { partitionKey: 'type', sortKey: 'dateTimeOccurred' },
      byAggregateId: { partitionKey: 'type', sortKey: 'aggregateId' },
    },
  });
  const storeEvent = new Function(stack, 'storeEvent', {
    handler: 'modules/audit/useCases/storeEvent/index.handler',
    environment: {
      StorageTable: storageTable.tableName,
    },
  });
  allowAutoInvoke(storeEvent);
  distributeDomainEvents.addEnvironment('storeEvent', storeEvent.functionName);
  storeEvent.grantInvoke(distributeDomainEvents);
  storeEvent.addToRolePolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    resources: [storageTable.tableArn],
    actions: ['dynamodb:PutItem'],
  }));

  stack.addOutputs({
    appsyncId: api.apiId,
    appsyncKey: api.cdk.graphqlApi.apiKey,
    appsyncUrl: api.url,
  });

  // Allow function to call itself for retry strategy implemented in BaseController and BaseTransaction using lambda dispatcher
  // eslint-disable-next-line @typescript-eslint/ban-types
  function allowAutoInvoke(lambda: Function) {
    const statement = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [lambda.functionArn],
    });
    const policy = new iam.Policy(stack, `autoInvoke_${lambda.toString()}`, {
      statements: [statement],
    });
    policy.attachToRole(<iam.IRole>lambda.role);
  }
}
