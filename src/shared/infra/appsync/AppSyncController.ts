import {
  AppSyncResolverEvent,
  Context,
} from 'aws-lambda';
import { Envelope } from '../../core/Envelope';
import { BaseError } from '../../core/AppError';
import {
  BaseController,
  EnvelopUnexpectedT
} from '../../core/BaseController';
import { Created } from '../../core/Created';

type ExeResponse = Promise<
  | Envelope<unknown | Created>
  | { error: Envelope<BaseError> }
  | { error: EnvelopUnexpectedT }
  >
export abstract class AppSyncController<
  Request,
  Response,
> extends BaseController<AppSyncResolverEvent<Request>, Response, ExeResponse> {
  protected event!: AppSyncResolverEvent<Request>;
  protected context!: Context;

  public async execute(
    event: AppSyncResolverEvent<Request>,
    context: Context
  ): ExeResponse {
    this.event = event;
    this.context = context;

    try {
      if (this.getTransaction) this.transaction = await this.getTransaction();
      const implResult = await this.executeImpl(event.arguments);
      if ([200, 201].includes(implResult.status)) {
        if (this.transaction) await this.handleCommit();
        return Envelope.ok(implResult.result);
      } else {
        return {
          error: Envelope.error(implResult.result as BaseError),
        };
      }
    } catch (err) {
      return this.handleUnexpectedError(err);
    }
  }
}
