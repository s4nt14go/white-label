import { APIGatewayController } from '../../../../shared/infra/http/APIGatewayController';
import { CreateTransactionDTO } from './CreateTransactionDTO';
import { IAccountRepo } from '../../repos/IAccountRepo';
import { CreateTransactionErrors } from './CreateTransactionErrors';
import { Amount } from '../../domain/Amount';
import { BaseError } from '../../../../shared/core/AppError';
import { Description } from '../../domain/Description';

export class CreateTransaction extends APIGatewayController {
  private readonly accountRepo: IAccountRepo;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public constructor(accountRepo: IAccountRepo, getTransaction: any) {
    super(getTransaction);
    this.accountRepo = accountRepo;
  }

  protected async executeImpl(dto: CreateTransactionDTO) {
    // As this use case is a command, include all repos queries in a serializable transaction
    this.accountRepo.setTransaction(this.transaction);

    const { userId } = dto;

    const descriptionOrError = Description.create({ value: dto.description });
    if (descriptionOrError.isFailure)
      return this.fail(
        new CreateTransactionErrors.InvalidDescription(
          descriptionOrError.error as BaseError
        )
      );
    const description = descriptionOrError.value;

    const deltaOrError = Amount.create({ value: dto.delta });
    if (deltaOrError.isFailure)
      return this.fail(
        new CreateTransactionErrors.InvalidDelta(deltaOrError.error as BaseError)
      );
    const delta = deltaOrError.value;

    const account = await this.accountRepo.getAccountByUserId(userId);
    if (!account)
      return this.fail(new CreateTransactionErrors.AccountNotFound(userId));

    const transactionOrError = account.createTransaction(delta, description);
    if (transactionOrError.isFailure)
      return this.fail(new CreateTransactionErrors.InvalidTransaction(transactionOrError.error as BaseError));

    await this.accountRepo.createTransaction(transactionOrError.value, userId);

    return this.created();
  }
}
