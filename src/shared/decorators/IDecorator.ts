import { AppSyncResolverEvent, Context } from 'aws-lambda';
import { Envelope } from '../core/Envelope';
import { Created } from '../core/Created';
import { BaseError } from '../core/AppError';

export type ExeResponse = Promise<
  // ...if AppSyncController/SubscriberController completed the use case successfully
  | Envelope<unknown | Created>
  // ...if AppSyncController/SubscriberController couldn't complete the use case because of an expected possible error
  | Envelope<BaseError>
  >;

export interface IDecorator<Request> {
  // execute for AppSyncController:
  // execute(event: AppSyncResolverEvent<Request>, context: Context): ExeResponse;
  // execute for SubscriberController
  // execute(event: Request): ExeResponse;
  // ...both merged:
  execute(event: AppSyncResolverEvent<Request> | Request, context?: Context): ExeResponse;
  wrapee: {
    execute: IDecorator<Request>['execute'];
  }
}