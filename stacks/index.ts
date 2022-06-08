import { MyStack } from './MyStack';
import { App } from '@serverless-stack/resources';

export default function (app: App) {
  app.setDefaultFunctionProps({
    runtime: 'nodejs16.x',
    srcPath: 'src',
    bundle: {
      format: 'esm',
    },
  });
  app.stack(MyStack);
}
