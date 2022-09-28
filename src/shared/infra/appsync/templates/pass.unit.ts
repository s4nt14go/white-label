import { getAppsyncContext, invokeVtl } from '../../../utils/test';
import path from 'path';

test('request and response vtls should pass args.data', () => {
  const args = {
    data: {
      accountId: '$accountId',
      transaction: {
        balance: '$balance',
        date: '$date',
        delta: '$delta',
        description: '$description',
        id: '$id',
      },
    },
  };
  const context = getAppsyncContext({}, args);

  let reqTemplatePath = path.resolve(__dirname, './pass.request.vtl');
  let result = invokeVtl(reqTemplatePath, context);
  expect(result).toMatchObject(args.data);

  reqTemplatePath = path.resolve(__dirname, './pass.response.vtl');
  result = invokeVtl(reqTemplatePath, context);
  expect(result).toMatchObject(args.data);
});
