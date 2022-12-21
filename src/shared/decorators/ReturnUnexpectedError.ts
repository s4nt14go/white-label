import { AppSyncResolverEvent, Context } from 'aws-lambda';
import { Envelope } from '../core/Envelope';
import { UnexpectedError as _UnexpectedError } from '../core/AppError';
import { ExeResponse, IDecorator } from './IDecorator';

export class ReturnUnexpectedError<Request>
  implements IDecorator<Request>
{
  public wrapee: IDecorator<Request>['wrapee'];

  public constructor(
    wrapee: IDecorator<Request>['wrapee']
  ) {
    this.wrapee = wrapee;
  }

  public async execute(
    event: AppSyncResolverEvent<Request>,
    context: Context
  ): ExeResponse {
    console.log(`${this.constructor.name}.execute`);

    try {
      return await this.wrapee.execute(event, context);
    } catch (error) {
      console.log(`An unexpected error occurred @ ${this.constructor.name}.execute`, error);
      console.log(`Context`, event);
      console.log(`Event`, context);
      const r = {
        ...Envelope.error(new _UnexpectedError()),
        logGroup: context.logGroupName,
        logStream: context.logStreamName,
        awsRequest: context.awsRequestId,
      };
      console.log(`return`, r);
      return r;
    }
  }
}
