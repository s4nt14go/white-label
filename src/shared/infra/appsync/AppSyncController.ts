import { AppSyncResolverEvent } from 'aws-lambda';
import { Envelope } from '../../core/Envelope';
import { BaseError } from '../../core/AppError';
import { ControllerResult } from '../../core/ControllerResult';
import { ExeResponse } from '../../decorators/IDecorator';

export const successfulCodes = [200, 201];

export abstract class AppSyncController<Request, Response> {

  protected abstract executeImpl(
    dto: unknown | Request
  ): ControllerResult<Response>;
  public async execute(
    event: AppSyncResolverEvent<Request>,
  ): ExeResponse {
    console.log(`${this.constructor.name}.execute`);

    const implResult = await this.executeImpl(event.arguments);
    if (successfulCodes.includes(implResult.status))
      return Envelope.ok(implResult.result);

    console.log('implResult error', implResult);
    return Envelope.error(implResult.result as BaseError);
  }
}
