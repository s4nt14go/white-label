declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      // Need to declare this env vars to get rid of undefined errors for process.env.<var>
      notifySlackChannel: string;
      someWork: string;
      createAccount: string;
      notifyFE: string;
    }
  }
}
export {};
