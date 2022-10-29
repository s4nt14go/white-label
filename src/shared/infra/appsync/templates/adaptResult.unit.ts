import { getAppsyncInput, invokeVtl } from '../../../utils/test';
import path from 'path';

describe('adaptResult.vtl', () => {
  it('should unnest $ctx.result.result', () => {
    const templatePath = path.resolve(__dirname, './adaptResult.vtl');

    const input = getAppsyncInput({
      result: {
        some_data: 10,
      },
      time: 'some time',
    });
    const result = invokeVtl(templatePath, input);

    expect(result).toMatchObject({
      some_data: 10,
      response_time: 'some time',
    });
  });
});
