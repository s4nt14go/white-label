import { AppSyncResolverEvent, Context } from 'aws-lambda';
import { ExeResponse, IDecorator } from './IDecorator';

export class DBretry<Request> implements IDecorator<Request> {
  public wrapee: IDecorator<Request>['wrapee'];

  public constructor(wrapee: IDecorator<Request>['wrapee']) {
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
      console.log(`Error @ ${this.constructor.name}`, error);

      // TODO: Implement retry
      throw error;
    }
  }
}
