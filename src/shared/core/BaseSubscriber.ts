import {
  BaseController,
  EnvelopUnexpectedT
} from './BaseController';
import { Envelope } from './Envelope';
import { BaseError } from './AppError';
import { Context } from 'aws-lambda';

type ExeResponse = Promise<
  | void
  | { error: Envelope<BaseError> }
  | { error: EnvelopUnexpectedT }
  >
export abstract class BaseSubscriber<Request, Response> extends BaseController<Response, Request, ExeResponse> {
  protected event!: Request;
  protected context = {} as Context;

  public async execute(event: Request): ExeResponse {
    this.event = event;

    try {
      if (this.getTransaction) this.transaction = await this.getTransaction();
      const implResult = await this.executeImpl(event);
      if (implResult.status === 200 || implResult.status === 201) {
        if (this.transaction) await this.handleCommit();
        return;
      } else {
        console.log('implResult', implResult);
        throw Error('No success??');
      }
    } catch (err) {
      await this.handleUnexpectedError(err);
    }
  }
}
