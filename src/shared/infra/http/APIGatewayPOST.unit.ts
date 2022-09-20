import { APIGatewayPOST } from './APIGatewayPOST';
import { APIGatewayEvent, Context } from 'aws-lambda';
import { ControllerResultAsync } from '../../core/BaseController';
import { Status } from '../../core/Status';

class Sample extends APIGatewayPOST<void> {
  protected executeImpl(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dto: unknown | APIGatewayEvent
  ): ControllerResultAsync<void> {
    return Promise.resolve({ status: Status.OK });
  }
  public constructor() {
    super({});
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
