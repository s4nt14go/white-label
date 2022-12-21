import { ControllerResultAsync } from './BaseController';
import { BaseError } from './AppError';
import { Context } from 'aws-lambda';
import { successfulCodes } from '../infra/appsync/AppSyncController';
import { ExeResponse } from '../decorators/IDecorator';

export abstract class SubscriberController<Request, Response> {
  protected event!: Request;
  protected context = {} as Context;

  protected abstract executeImpl(dto: unknown | Request): ControllerResultAsync<Response>;

  public async execute(event: Request): ExeResponse {
    this.event = event;

    const implResult = await this.executeImpl(event);
    if (successfulCodes.includes(implResult.status)) return;

    console.log('implResult error', implResult);
    throw Error((implResult.result as BaseError).type);
  }
}
