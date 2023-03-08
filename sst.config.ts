import type { SSTConfig } from 'sst';
import { MyStack } from './stacks/MyStack';

export default {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  config(_input) {
    return {
      name: 'white-label',
      region: 'us-east-1',
    };
  },
  async stacks(app) {
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
} satisfies SSTConfig;