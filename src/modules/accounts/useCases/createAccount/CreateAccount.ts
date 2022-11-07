import { SubscriberController } from '../../../../shared/core/SubscriberController';
import { Request, Response } from './CreateAccountDTOs';
import { IAccountRepo } from '../../repos/IAccountRepo';
import { ControllerResultAsync } from '../../../../shared/core/BaseController';

export class CreateAccount extends SubscriberController<Request, Response> {
  private readonly accountRepo: IAccountRepo;

  public constructor(
    accountRepo: IAccountRepo,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renewConn: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getTransaction: any
  ) {
    super(renewConn, getTransaction);
    this.accountRepo = accountRepo;
  }

  public async executeImpl(event: Request): ControllerResultAsync<Response> {
    this.accountRepo.setTransaction(this.transaction); // As this use case is a command, include all repos queries in a serializable transaction

    const { aggregateId } = event;
    await this.accountRepo.create(aggregateId);

    return { status: 200 };
  }
}
