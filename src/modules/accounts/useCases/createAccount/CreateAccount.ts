import { SubscriberController } from '../../../../shared/core/SubscriberController';
import { UserCreatedEvent } from '../../../users/domain/events/UserCreatedEvent';
import { IAccountRepo } from '../../repos/IAccountRepo';
import { Account } from '../../domain/Account';

export class CreateAccount extends SubscriberController<UserCreatedEvent> {
  private readonly accountRepo: IAccountRepo;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public constructor(accountRepo: IAccountRepo, getTransaction: any) {
    super(getTransaction);
    this.accountRepo = accountRepo;
  }

  public async executeImpl(event: UserCreatedEvent): Promise<void> {
    this.accountRepo.setTransaction(this.transaction); // As this use case is a command, include all repos queries in a serializable transaction

    const { aggregateId } = event;
    await this.accountRepo.create(aggregateId, Account.Initial());
  }
}
