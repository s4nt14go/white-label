import {
  BaseController,
  EnvelopUnexpectedT,
} from './BaseController';
import { Envelope } from './Envelope';
import { BaseError } from './AppError';
import { Context } from 'aws-lambda';

type ExeResponse = Promise<
  | void
  | { error: Envelope<BaseError> }
  | { error: EnvelopUnexpectedT }
  >
export abstract class SubscriberController<Request, Response> extends BaseController<Request, Response, ExeResponse> {
  protected event!: Request;
  protected context = {} as Context;

  public async execute(event: Request): ExeResponse {
    this.event = event;

    let implResult;
    try {
      if (this.getTransaction) this.transaction = await this.getTransaction();
      implResult = await this.executeImpl(event);
      if ([200, 201].includes(implResult.status)) {
        if (this.transaction) await this.handleCommit();
        return;
      }
    } catch (err) {
      await this.handleUnexpectedError(err);
    }
    console.log('implResult', implResult);
    throw Error('No success??');
  }
}
