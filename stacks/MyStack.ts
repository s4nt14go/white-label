import { StackContext, Api, Function } from '@serverless-stack/resources';
import { Table } from "@serverless-stack/resources";

export function MyStack({ stack }: StackContext) {

  const UsersTable = new Table(stack, 'Users', {
    fields: {
      id: 'string',
      username: 'string',
      email: 'string',
    },
    primaryIndex: { partitionKey: 'id' },
    globalIndexes: { 
      byUsername: { partitionKey: 'username' }, 
      byEmail: { partitionKey: 'email' }, 
    },
  });

  const notifySlackChannel = new Function(stack, 'notifySlackChannel', {
    handler: 'modules/notification/useCases/notifySlackChannel/index.handler',
  });
  const someWork = new Function(stack, 'someWork', {
    handler: 'modules/users/useCases/someWork/index.handler',
  });

  const distributeDomainEvents = new Function(stack, 'distributeDomainEvents', {
    handler: 'core/infra/dispatchEvents/DistributeDomainEvents.handler',
    environment: {
      notifySlackChannel: notifySlackChannel.functionName,
      someWork: someWork.functionName,
      UsersTable: UsersTable.tableName,
    },
  });
  notifySlackChannel.grantInvoke(distributeDomainEvents);
  someWork.grantInvoke(distributeDomainEvents);

  const createUser = new Function(stack, 'createUser', {
    handler: 'modules/users/useCases/createUser/index.handler',
    environment: {
      distributeDomainEvents: distributeDomainEvents.functionName,
      UsersTable: UsersTable.tableName,
    },
  });
  distributeDomainEvents.grantInvoke(createUser);
  UsersTable.cdk.table.grantReadWriteData(createUser)

  const api = new Api(stack, 'api', {
    routes: {
      'POST /createUser': createUser,
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
