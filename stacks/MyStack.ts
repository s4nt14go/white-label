import { StackContext, Function, AppSyncApi } from '@serverless-stack/resources';
import * as cdk from 'aws-cdk-lib';
import * as appsync from '@aws-cdk/aws-appsync-alpha';
import { SSM } from 'aws-sdk';
import * as iam from 'aws-cdk-lib/aws-iam';

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

  const notifySlackChannel = new Function(stack, 'notifySlackChannel', {
    handler: 'modules/notification/useCases/notifySlackChannel/index.handler',
  });
  allowAutoInvoke(notifySlackChannel);
  const someWork = new Function(stack, 'someWork', {
    handler: 'modules/users/useCases/someWork/index.handler',
  });
  allowAutoInvoke(someWork);

  const createAccount = new Function(stack, 'createAccount', {
    handler: 'modules/accounts/useCases/createAccount/index.handler',
    environment: dbCreds,
  });
  allowAutoInvoke(createAccount);

  const distributeDomainEvents = new Function(stack, 'distributeDomainEvents', {
    handler: 'shared/infra/dispatchEvents/DistributeDomainEvents.handler',
    environment: {
      notifySlackChannel: notifySlackChannel.functionName,
      someWork: someWork.functionName,
      createAccount: createAccount.functionName,
    },
  });
  allowAutoInvoke(distributeDomainEvents);
  notifySlackChannel.grantInvoke(distributeDomainEvents);
  someWork.grantInvoke(distributeDomainEvents);
  createAccount.grantInvoke(distributeDomainEvents);

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
    environment: dbCreds,
  });
  allowAutoInvoke(transfer);
  const getAccountByUserId = new Function(stack, 'getAccountByUserId', {
    handler: 'modules/accounts/useCases/getAccountByUserId/index.handler',
    environment: dbCreds,
  });
  allowAutoInvoke(getAccountByUserId);

  const adaptResult = {
    file: 'src/shared/infra/appsync/templates/adaptResult.vtl',
  };
  const passResponse = {
    file: 'src/shared/infra/appsync/templates/pass.response.vtl',
  };
  const passRequest = {
    file: 'src/shared/infra/appsync/templates/pass.request.vtl',
  };
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
        dataSource: 'none',
        requestMapping: passRequest,
        responseMapping: passResponse,
      },
      'Subscription onNotifyTransactionCreated': {
        dataSource: 'none',
        requestMapping: passRequest,
        responseMapping: passResponse,
      },
    },
  });

  const notifyFE = new Function(stack, 'notifyFE', {
    handler: 'modules/notification/useCases/notifyFE/index.handler',
    environment: {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      appsyncKey: api.cdk.graphqlApi.apiKey!,
      appsyncUrl: api.url,
    },
  });
  allowAutoInvoke(notifyFE);
  distributeDomainEvents.addEnvironment('notifyFE', notifyFE.functionName);
  notifyFE.grantInvoke(distributeDomainEvents);

  stack.addOutputs({
    appsyncId: api.apiId,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    appsyncKey: api.cdk.graphqlApi.apiKey!,
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
