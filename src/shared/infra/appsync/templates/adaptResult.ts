import { Context, util } from '@aws-appsync/utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function request(_ctx: Context) {
  return {}
}

export function response(ctx: Context) {
  if (ctx.result.errorType) {
    // Keep error detection in synchro with src/shared/core/Envelope.ts: as Envelope.errorType takes BaseError.constructor.name, the error will always be detected by AppSync
    return util.error(
      ctx.result.errorMessage as string,
      ctx.result.errorType,
      null,
      ctx.result
    );
  }

  // Unnest ctx.result.result, e.g. instead of returning { time: <value1>, result: { some: <value2> } }, we end up with { response_time: <value1>, some: <value2> }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unnest = {} as any;

  // Top-level Envelop keys, e.g. time in any response
  for (const key in ctx.result) {
    unnest[`response_${key}`] = ctx.result[`${key}`];
  }
  delete unnest.response_result;

  // Actual result keys, e.g. balance, active in getAccountByUserId response
  for (const key in ctx.result.result) {
    unnest[`${key}`] = ctx.result.result[`${key}`];
  }
  return unnest;
}
