import { StackContext, Api, Function } from '@serverless-stack/resources';
import { SSM } from 'aws-sdk';

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
  const someWork = new Function(stack, 'someWork', {
    handler: 'modules/users/useCases/someWork/index.handler',
  });

  const createAccount = new Function(stack, 'createAccount', {
    handler: 'modules/accounts/useCases/createAccount/index.handler',
    environment: dbCreds,
  });

  const distributeDomainEvents = new Function(stack, 'distributeDomainEvents', {
    handler: 'shared/infra/dispatchEvents/DistributeDomainEvents.handler',
    environment: {
      notifySlackChannel: notifySlackChannel.functionName,
      someWork: someWork.functionName,
      createAccount: createAccount.functionName,
    },
  });
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
  distributeDomainEvents.grantInvoke(createUser);

  const api = new Api(stack, 'api', {
    routes: {
      'POST /createUser': createUser,
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
