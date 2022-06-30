import { StackContext, Api, Function } from '@serverless-stack/resources';
import * as iam from 'aws-cdk-lib/aws-iam';
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
  distributeDomainEvents.attachPermissions([
    new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      effect: iam.Effect.ALLOW,
      resources: [notifySlackChannel.functionArn, someWork.functionArn],
    }),
  ]);


  const createUser = new Function(stack, 'createUser', {
    handler: 'modules/users/useCases/createUser/index.handler',
    environment: {
      distributeDomainEvents: distributeDomainEvents.functionName,
      UsersTable: UsersTable.tableName,
    },
  });
  createUser.attachPermissions([
    new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      effect: iam.Effect.ALLOW,
      resources: [distributeDomainEvents.functionArn],
    }),
    new iam.PolicyStatement({
      actions: ['dynamodb:Query', 'dynamodb:PutItem'],
      effect: iam.Effect.ALLOW,
      resources: [`${UsersTable.tableArn}*`],
    }),
  ]);

  new Api(stack, 'api', {
    routes: {
      'POST /createUser': createUser,
    },
  });
}
