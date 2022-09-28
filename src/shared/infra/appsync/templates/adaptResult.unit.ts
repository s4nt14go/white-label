import {
  getAppsyncContext,
  invokeVtl
} from '../../../utils/test';
import path from 'path';

describe('adaptResult.vtl', () => {
  it("should unnest $ctx.result.result", () => {
    const templatePath = path.resolve(__dirname, './adaptResult.vtl')

    const context = getAppsyncContext({
      "result": {
        "some_data": 10,
      },
      "time": "some time",
    })
    const result = invokeVtl(templatePath, context)

    expect(result).toMatchObject({
      "some_data": 10,
      "response_time": "some time",
    })
  })
})
