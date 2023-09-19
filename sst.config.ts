// import type { SSTConfig } from 'sst';
import { MyStack } from './stacks/MyStack';

export default {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  config(_input: any) {
    return {
      name: 'white-label',
      region: 'us-east-1',
    };
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async stacks(app: any) {
    app.setDefaultFunctionProps({
      runtime: 'nodejs16.x',  // Node v16 is used all along the project and pipeline
      logRetention: 'two_weeks',
      nodejs: {
        minify: true,
        format: 'cjs',
        esbuild: {
          keepNames: true,
        },
      },
    });
    await app.stack(MyStack);
  },
}/* satisfies SSTConfig*/;