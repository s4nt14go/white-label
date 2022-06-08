import { StackContext, Api, Function } from '@serverless-stack/resources';
import * as iam from 'aws-cdk-lib/aws-iam';

export function MyStack({ stack }: StackContext) {

  stack.setDefaultFunctionProps({
    logRetention: 14,
    bundle: {
      format: "esm" as "esm",
      minify: true,
      esbuildConfig: {
        keepNames: true,
      },
    }
  })

  const notifySlackChannel = new Function(stack, 'notifySlackChannel', {
    handler: 'modules/notification/useCases/notifySlackChannel/index.handler',
  });
  const someWork = new Function(stack, 'someWork', {
    handler: 'modules/users/useCases/someWork/index.handler',
  });

  const distributeDomainEvents = new Function(stack, 'distributeDomainEvents', {
    handler: 'core/infra/DistributeDomainEvents.handler',
    environment: {
      notifySlackChannel: notifySlackChannel.functionName,
      someWork: someWork.functionName,
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
    },
  });
  createUser.attachPermissions([
    new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      effect: iam.Effect.ALLOW,
      resources: [distributeDomainEvents.functionArn],
    }),
  ]);

  new Api(stack, 'api', {
    routes: {
      'POST /createUser': createUser,
    },
  });
}
