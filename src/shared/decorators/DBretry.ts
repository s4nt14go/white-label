import { AppSyncResolverEvent, Context } from 'aws-lambda';
import { ExeResponse, IDecorator } from './IDecorator';
import { DBretryTable } from './DBretryTable';
import { ConnectionAcquireTimeoutError } from 'sequelize';
import { RetryableRequest } from './IRetryableRequest';

export class DBretry<Request extends RetryableRequest> implements IDecorator<Request> {
  private readonly MaxFails = 3;
  public wrapee: IDecorator<Request>['wrapee'];
  private readonly renewConn: () => void;
  private dbRetryTable: DBretryTable;
  private readonly handlerPath: string;
  private failNumber = 0;

  public constructor(
    wrapee: IDecorator<Request>['wrapee'],
    dbRetryTable: DBretryTable,
    renewConn: () => void,
    handlerPath: string
  ) {
    this.wrapee = wrapee;
    this.renewConn = renewConn;
    this.dbRetryTable = dbRetryTable;
    this.handlerPath = handlerPath;
  }

  public async execute(
    event:
      // When it's an AppSync event (controller implements AppSyncController) [Note 1]
      AppSyncResolverEvent<Request> |
      // ...when it's a Subscriber event (controller implements SubscriberController) [Note 2]
      Request,
    context: Context
  ): ExeResponse {
    console.log(`${this.constructor.name}.execute`);

    try {
      return await this.wrapee.execute(event, context);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.log(`Error @ ${this.constructor.name}`, error);

      if (
        // Code 40001 is specific of CockroachDB
        (error.parent && error.parent.code === '40001') ||
        error.code === '40001' ||
        error instanceof ConnectionAcquireTimeoutError ||
        error.name.includes('Database')
      ) {
        console.log(`DB error`);

        let dto;
        if (this.instanceOfAppSynEvent(event)) {  // See Note 1
          dto = event.arguments;
        } else {  // See Note 2
          dto = event;
        }
        if (!dto.firstFail) {
          dto.firstFail = new Date().toJSON();
          const retryToken = this.dbRetryTable.genToken(dto);
          this.failNumber = 1;
          await this.dbRetryTable.setFailNumber(
            retryToken,
            this.failNumber,
            context,
            JSON.stringify(dto)
          );
        } else {
          const retryToken = this.dbRetryTable.genToken(dto);
          this.failNumber =
            (await this.dbRetryTable.getFailNumber(retryToken)) + 1;
          await this.dbRetryTable.setFailNumber(
            retryToken,
            this.failNumber,
            context
          );
          if (this.failNumber === this.MaxFails) {
            console.log(`Max fails (${this.MaxFails}) reached, rethrowing error`);
            throw error;
          }
        }

        console.log(`DB fail #${this.failNumber}, will retry...`);
        await this.renewConn();
        await new Promise(
          (
            resolve // wait some before retrying
          ) => setTimeout(resolve, (this.failNumber + Math.random()) * 100)
        );
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { handler } = require(this.handlerPath);
        return handler(event, context);
      }
      console.log(
        `Not a db error, bubble it up to be handled by ReturnUnexpectedError`
      );
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private instanceOfAppSynEvent(event: any): event is AppSyncResolverEvent<Request> {
    return !!event.arguments;
  }
}
