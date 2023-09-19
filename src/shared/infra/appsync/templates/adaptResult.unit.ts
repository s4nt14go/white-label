import { getAppsyncCtx } from '../../../utils/test';
import { response } from './adaptResult';

describe('adaptResult.ts', () => {
  it('should unnest ctx.result.result', () => {

    const input = getAppsyncCtx({}, {
      result: {
        some_data: 10,
      },
      time: 'some time',
    });
    const result = response(input);

    expect(result).toMatchObject({
      some_data: 10,
      response_time: 'some time',
    });
  });
});
