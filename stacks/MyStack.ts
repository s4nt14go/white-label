import { StackContext, Function, AppSyncApi, Table, Stack } from 'sst/constructs';
import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import { SSM } from 'aws-sdk';
import * as iam from 'aws-cdk-lib/aws-iam';
import { BaseDataSource } from 'aws-cdk-lib/aws-appsync';
import { bundleAppSyncResolver } from './helpers';
import { Code } from 'aws-cdk-lib/aws-appsync/lib/code';

export async function MyStack({ stack, app }: StackContext) {
  const ssm = new SSM();
  let ssmGetResponse;

  try {
    ssmGetResponse = await ssm
      .getParameter({ Name: `/${app.name}/${app.stage}/cockroach` })
      .promise();
  } catch (e) {
    console.log(
      `\nMake sure you have parameter /${app.name}/${app.stage}/cockroach in AWS account's Parameter Store with your CockroachDB data following this structure: $username,$password,$database,$host,$dialect,$port,$cluster\n`,
    );
    throw e;
  }

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
    handler: 'src/shared/infra/invocation/DistributeDomainEvents.handler',
  });

  const notifySlackChannel = new Function(stack, 'notifySlackChannel', {
    handler: 'src/modules/notification/useCases/notifySlackChannel/index.handler',
  });
  allowSubscribeToDomainEvents(notifySlackChannel, 'notifySlackChannel');

  const someWork = new Function(stack, 'someWork', {
    handler: 'src/modules/users/useCases/someWork/index.handler',
  });
  allowSubscribeToDomainEvents(someWork, 'someWork');

  const DBretryTable = new Table(stack, 'DBretry', {
    fields: {
      retryToken: 'string',
    },
    primaryIndex: { partitionKey: 'retryToken' },
  });

  const createAccount = new Function(stack, 'createAccount', {
    handler: 'src/modules/accounts/useCases/createAccount/index.handler',
    environment: dbCreds,
  });
  allowSubscribeToDomainEvents(createAccount, 'createAccount');
  DBretryable(createAccount);

  const createUser = new Function(stack, 'createUser', {
    handler: 'src/modules/users/useCases/createUser/index.handler',
    environment: dbCreds,
  });
  allowEmittingDomainEvents(createUser);
  DBretryable(createUser);

  const createTransaction = new Function(stack, 'createTransaction', {
    handler: 'src/modules/accounts/useCases/createTransaction/index.handler',
    environment: dbCreds,
  });
  allowEmittingDomainEvents(createTransaction);
  DBretryable(createTransaction);

  const transfer = new Function(stack, 'transfer', {
    handler: 'src/modules/accounts/useCases/transfer/index.handler',
    environment: dbCreds,
  });
  allowEmittingDomainEvents(transfer);
  DBretryable(transfer);

  const getAccountByUserId = new Function(stack, 'getAccountByUserId', {
    handler: 'src/modules/accounts/useCases/getAccountByUserId/index.handler',
    environment: dbCreds,
  });
  DBretryable(getAccountByUserId);

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
        logConfig: {
          fieldLogLevel: appsync.FieldLogLevel.ALL,
        },
      },
    },
    dataSources: {
      none: { type: 'none' },
    },
    resolvers: {
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

  const adaptResult = bundleAppSyncResolver(
    'src/shared/infra/appsync/templates/adaptResult.ts'
  );

  addResolverWithLambda(
    'Query',
    'getAccountByUserId',
    adaptResult,
    getAccountByUserId
  );
  addResolverWithLambda(
    'Mutation',
    'transfer',
    adaptResult,
    transfer
  );
  addResolverWithLambda(
    'Mutation',
    'createTransaction',
    adaptResult,
    createTransaction
  );
  addResolverWithLambda(
    'Mutation',
    'createUser',
    adaptResult,
    createUser
  );

  const passThrough = bundleAppSyncResolver(
    'src/shared/infra/appsync/templates/passThrough.ts'
  );
  addResolverWithTable(
    'Mutation',
    'notifyTransactionCreated',
    passThrough,
    bundleAppSyncResolver(
      'src/shared/infra/appsync/templates/Mutation.notifyTransactionCreated.ts'
    ),
    notificationsTable
  );

  if (!api.cdk.graphqlApi.apiKey) {
    console.log('api.cdk', api.cdk);
    throw Error(`apiKey undefined`);
  }

  const notifyFE = new Function(stack, 'notifyFE', {
    handler: 'src/modules/notification/useCases/notifyFE/index.handler',
    environment: {
      appsyncKey: api.cdk.graphqlApi.apiKey,
      appsyncUrl: api.url,
    },
  });
  allowSubscribeToDomainEvents(notifyFE, 'notifyFE');

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
    handler: 'src/modules/audit/useCases/storeEvent/index.handler',
    environment: {
      StorageTable: storageTable.tableName,
    },
  });
  allowSubscribeToDomainEvents(storeEvent, 'storeEvent');
  storeEvent.addToRolePolicy(
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: [storageTable.tableArn],
      actions: ['dynamodb:PutItem'],
    })
  );

  stack.addOutputs({
    appsyncId: api.apiId,
    appsyncKey: api.cdk.graphqlApi.apiKey,
    appsyncUrl: api.url,
  });

  function getAppsyncFunctionForLambda(name: string, datasource: string, stack: Stack) {
    return new appsync.AppsyncFunction(stack, name, {
      name,
      api: api.cdk.graphqlApi,
      dataSource: api.getDataSource(datasource) as BaseDataSource,
    });
  }
  function getAppsyncFunctionForTable(name: string, datasource: string, stack: Stack, adapter: Code) {
    return new appsync.AppsyncFunction(stack, name, {
      name,
      api: api.cdk.graphqlApi,
      dataSource: api.getDataSource(datasource) as BaseDataSource,
      code: adapter,
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });
  }
  function addResolverWithTable(
    type: string,
    field: string,
    resolverAdapter: Code,
    appsyncFunctionAdapter: Code,
    table: Table,
  ) {
    const prefix = type + field;
    const ds = prefix + 'DS';
    api.addDataSources(stack, {
      [ds]: {
        type: 'dynamodb',
        table,
      },
    });
    new appsync.Resolver(stack, prefix + 'R', {
      api: api.cdk.graphqlApi,
      typeName: type,
      fieldName: field,
      code: resolverAdapter,
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [
        getAppsyncFunctionForTable(prefix + 'AF', ds, stack, appsyncFunctionAdapter),
      ],
    });
  }
  function addResolverWithLambda(
    type: string,
    field: string,
    resolverAdapter: Code,
    // eslint-disable-next-line @typescript-eslint/ban-types
    lambda: Function
  ) {
    const prefix = type + field;
    const ds = prefix + 'DS';
    api.addDataSources(stack, {
      [ds]: lambda,
    });
    new appsync.Resolver(stack, prefix + 'R', {
      api: api.cdk.graphqlApi,
      typeName: type,
      fieldName: field,
      code: resolverAdapter,
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [
        getAppsyncFunctionForLambda(prefix + 'AF', ds, stack),
      ],
    });
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  function allowEmittingDomainEvents(lambda: Function) {
    distributeDomainEvents.grantInvoke(lambda);
    lambda.addEnvironment(
      'distributeDomainEvents',
      distributeDomainEvents.functionName
    );
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
  function allowSubscribeToDomainEvents(lambda: Function, envVar: string) {
    lambda.grantInvoke(distributeDomainEvents); // distributeDomainEvents can invoke lambda
    distributeDomainEvents.addEnvironment(envVar, lambda.functionName);
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
  function DBretryable(lambda: Function) {
    lambda.addEnvironment('DBretryTable', DBretryTable.tableName);
    lambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [DBretryTable.tableArn],
        actions: ['dynamodb:UpdateItem', 'dynamodb:GetItem'],
      })
    );
  }
}
