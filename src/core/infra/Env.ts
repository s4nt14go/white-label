// These env vars are defined in the lambdas in stacks/MyStack.ts
const { distributeDomainEvents, notifySlackChannel, someWork } = process.env;
export const Env = {
  // lambda createUser
  distributeDomainEvents,
  // lambda distributeDomainEvents
  notifySlackChannel,
  someWork,
};
