import { SubscriberController } from '../../../../shared/core/SubscriberController';
import { Request, Response } from './CreateAccountDTOs';
import { IAccountRepo } from '../../repos/IAccountRepo';
import { ControllerResultAsync } from '../../../../shared/core/BaseController';

export class CreateAccount extends SubscriberController<Request, Response> {
  private readonly accountRepo: IAccountRepo;

  public constructor(accountRepo: IAccountRepo) {
    super();
    this.accountRepo = accountRepo;
  }

  protected async executeImpl(event: Request): ControllerResultAsync<Response> {

    const { aggregateId } = event;
    await this.accountRepo.create(aggregateId);

    return { status: 200 };
  }
}
