import { APIGatewayController } from './APIGatewayController';
import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

class Sample extends APIGatewayController {
  protected executeImpl(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dto: unknown | APIGatewayEvent
  ): Promise<APIGatewayProxyResult> {
    return Promise.resolve(null as unknown as APIGatewayProxyResult);
  }
  public constructor() {
    super();
  }
}

const context = {} as unknown as Context;
test('Controller fails for non-parsable string', async () => {
  const event = {
    body: 'non-parsable',
  } as unknown as APIGatewayEvent;

  const controller = new Sample();
  const result = await controller.execute(event, context);

  expect(result.statusCode).toBe(400);
  const parsed = JSON.parse(result.body)
  expect(parsed.errorType).toBe('MalformedRequest');
});
