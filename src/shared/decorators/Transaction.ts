import { Transaction as SequelizeTransaction } from 'sequelize';
import { IRepo } from '../core/IRepo';
import { AppSyncResolverEvent, Context } from 'aws-lambda';
import { ExeResponse, IDecorator } from './IDecorator';

// All command use cases that use the SQL DB should be decorated by this so all repos queries are wrapped in a serializable transaction, for query use cases don't
export class Transaction<Request> implements IDecorator<Request> {
  public wrapee: IDecorator<Request>['wrapee'];

  protected getTransaction: () => SequelizeTransaction;
  private readonly repos: IRepo[];
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  private transaction!: SequelizeTransaction;

  public constructor(
    wrapee: IDecorator<Request>['wrapee'],
    getTransaction: () => SequelizeTransaction,
    repos: IRepo[]
  ) {
    this.wrapee = wrapee;
    this.getTransaction = getTransaction;
    this.repos = repos;
  }

  public async execute(
    event: AppSyncResolverEvent<Request>,
    context: Context
  ): ExeResponse {
    console.log(`${this.constructor.name}.execute`);

    this.transaction = await this.getTransaction();
    for (const repo of this.repos) {
      repo.setTransaction(this.transaction);
    }

    try {
      const r = await this.wrapee.execute(event, context);
      await this.transaction.commit();
      return r;
    } catch (error) {
      console.log(`Error @ ${this.constructor.name}`, error);

      try {
        await this.transaction.rollback();
      } catch (e) {
        console.log('Error when rolling back', e);
      }

      throw error;
    }
  }
}
