import { AppSyncController } from '../../../../shared/infra/appsync/AppSyncController';
import { Request, Response } from './CreateTransactionDTOs';
import { IAccountRepo } from '../../repos/IAccountRepo';
import { CreateTransactionErrors } from './CreateTransactionErrors';
import { Amount } from '../../domain/Amount';
import { BaseError } from '../../../../shared/core/AppError';
import { Description } from '../../domain/Description';
import { Guard } from '../../../../shared/core/Guard';
import { ControllerResult } from '../../../../shared/core/ControllerResult';
import { Status } from '../../../../shared/core/Status';
import { CreateTransactionEvents } from './CreateTransactionEvents';
import { IInvoker } from '../../../../shared/infra/invocation/LambdaInvoker';

const {BAD_REQUEST, CREATED} = Status;

export class CreateTransaction extends AppSyncController<Request, Response> {
  private readonly accountRepo: IAccountRepo;

  public constructor(
    accountRepo: IAccountRepo,
    invoker: IInvoker
  ) {
    super();
    this.accountRepo = accountRepo;
    CreateTransactionEvents.registration(invoker);
  }

  protected async executeImpl(dto: Request): ControllerResult<Response> {

    const { userId } = dto;

    const guardNull = Guard.againstNullOrUndefined(
      userId,
      new CreateTransactionErrors.UserIdNotDefined()
    );
    const guardType = Guard.isType(
      userId,
      'string',
      new CreateTransactionErrors.UserIdNotString(typeof userId)
    );
    const guardUuid = Guard.isUuid(
      userId,
      new CreateTransactionErrors.UserIdNotUuid(userId)
    );
    const combined = Guard.combine([guardNull, guardType, guardUuid]);
    if (combined.isFailure)
      return {
        status: BAD_REQUEST,
        result: combined.error as BaseError,
      };

    const descriptionOrError = Description.create({ value: dto.description });
    if (descriptionOrError.isFailure)
      return {
        status: BAD_REQUEST,
        result: new CreateTransactionErrors.InvalidDescription(
          descriptionOrError.error as BaseError
        ),
      };
    const description = descriptionOrError.value;

    const deltaOrError = Amount.create({ value: dto.delta });
    if (deltaOrError.isFailure)
      return {
        status: BAD_REQUEST,
        result: new CreateTransactionErrors.InvalidDelta(
          deltaOrError.error as BaseError
        ),
      };
    const delta = deltaOrError.value;

    const account = await this.accountRepo.getAccountByUserId(userId);
    if (!account)
      return {
        status: BAD_REQUEST,
        result: new CreateTransactionErrors.AccountNotFound(userId),
      };

    const transactionOrError = account.createTransaction(delta, description);
    if (transactionOrError.isFailure)
      return {
        status: BAD_REQUEST,
        result: new CreateTransactionErrors.InvalidTransaction(
          transactionOrError.error as BaseError
        ),
      };

    const transaction = transactionOrError.value;
    await this.accountRepo.createTransaction(
      transaction,
      account.id.toString()
    );

    return { status: CREATED, result: { id: transaction.id.toString() } };
  }
}
