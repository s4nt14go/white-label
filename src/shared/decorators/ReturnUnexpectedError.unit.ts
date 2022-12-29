import { ExeResponse } from './IDecorator';
import { ReturnUnexpectedError } from './ReturnUnexpectedError';
import { Transaction } from './Transaction';
import { fakeTransactionWithError } from '../utils/test';

test('Return unexpected error when sequelize transaction errors', async () => {
  const dummyController = {
    execute(): ExeResponse {
      return Object();
    },
  };
  const decorated1 = new Transaction(
    dummyController,
    fakeTransactionWithError,
    []
  );
  const decorated2 = new ReturnUnexpectedError(decorated1);
  const result = await decorated2.execute(Object(), Object());

  expect(result).toMatchObject({
    errorType: 'UnexpectedError',
  });
});
