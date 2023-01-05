import { AppSyncResolverEvent, Context } from 'aws-lambda';
import { Envelope } from '../../../../shared/core/Envelope';
import { ExeResponse, IDecorator } from '../../../../shared/decorators/IDecorator';
import { Request } from './GetAccountByUserIdDTOs';

export class GetAccountByUserIdCache implements IDecorator<Request> {
  public wrapee: IDecorator<Request>['wrapee'];
  private cache: Record<string, Envelope<unknown>> = {};

  public constructor(wrapee: IDecorator<Request>['wrapee']) {
    this.wrapee = wrapee;
  }

  public async execute(
    event: AppSyncResolverEvent<Request>,
    context: Context
  ): ExeResponse {
    console.log(`${this.constructor.name}.execute`);

    const userId = event.arguments.userId;
    if (userId in this.cache) {
      console.log(`Response for userId ${userId} taken from cache`);  // Used in test GetAccountByUserId.int.ts
      return this.cache[userId];
    }
    const response = await this.wrapee.execute(event, context);
    this.cache[userId] = response;
    console.log(`${userId} saved in cache`, this.cache);
    return response;
  }
}
