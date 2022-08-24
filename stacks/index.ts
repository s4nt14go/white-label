import { MyStack } from './MyStack';
import { App } from '@serverless-stack/resources';

export default function (app: App) {
  app.setDefaultFunctionProps({
    runtime: 'nodejs16.x', // Sometimes changes in node version aren't picked up, check it in AWS UI console
    srcPath: 'src',
    logRetention: 14,
    bundle: {
      minify: true,
      esbuildConfig: {
        keepNames: true,
      },
    },
  });
  app.stack(MyStack);
}
