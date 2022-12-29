import { ControllerResult } from './ControllerResult';
import { BaseError } from './AppError';
import { successfulCodes } from '../infra/appsync/AppSyncController';
import { ExeResponse } from '../decorators/IDecorator';
import { Envelope } from './Envelope';

export abstract class SubscriberController<Request, Response> {
  protected event!: Request;

  protected abstract executeImpl(dto: unknown | Request): ControllerResult<Response>;

  public async execute(event: Request): ExeResponse {
    this.event = event;

    const implResult = await this.executeImpl(event);
    if (successfulCodes.includes(implResult.status))
      return Envelope.ok(implResult.result);

    console.log('implResult error', implResult);
    throw Error((implResult.result as BaseError).type);
  }
}
