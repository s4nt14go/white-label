import { AppSyncController } from '../../../../shared/infra/appsync/AppSyncController';
import { Request, Response } from './TransferDTOs';
import { IAccountRepo } from '../../repos/IAccountRepo';
import { TransferErrors } from './TransferErrors';
import { AccountService } from '../../services/AccountService';
import { Amount } from '../../domain/Amount';
import { BaseError } from '../../../../shared/core/AppError';
import { Description } from '../../domain/Description';
import { Guard } from '../../../../shared/core/Guard';
import { CreateTransactionErrors } from '../createTransaction/CreateTransactionErrors';
import { ControllerResult } from '../../../../shared/core/ControllerResult';
import { Status } from '../../../../shared/core/Status';
import { CreateTransactionEvents } from '../createTransaction/CreateTransactionEvents';
import { IInvoker } from '../../../../shared/infra/invocation/LambdaInvoker';
const { CREATED, BAD_REQUEST } = Status;

export class Transfer extends AppSyncController<Request, Response> {
  private readonly accountRepo: IAccountRepo;

  public constructor(accountRepo: IAccountRepo, invoker: IInvoker) {
    super();
    this.accountRepo = accountRepo;
    CreateTransactionEvents.registration(invoker);
  }

  protected async executeImpl(dto: Request): ControllerResult<Response> {
    const descriptionOrError = Description.create({ value: dto.fromDescription });
    if (descriptionOrError.isFailure)
      return {
        status: BAD_REQUEST,
        result: new TransferErrors.FromDescriptionInvalid(
          descriptionOrError.error as BaseError
        ),
      };
    const fromDescription = descriptionOrError.value;

    let toDescription: Description;
    if (dto.toDescription === undefined) {
      toDescription = fromDescription;
    } else {
      const descriptionOrError = Description.create({ value: dto.toDescription });
      if (descriptionOrError.isFailure)
        return {
          status: BAD_REQUEST,
          result: new TransferErrors.ToDescriptionInvalid(
            descriptionOrError.error as BaseError
          ),
        };
      toDescription = descriptionOrError.value;
    }

    const deltaOrError = Amount.create({ value: dto.quantity });
    if (deltaOrError.isFailure)
      return {
        status: BAD_REQUEST,
        result: new TransferErrors.QuantityInvalid(
          deltaOrError.error as BaseError
        ),
      };
    const delta = deltaOrError.value;

    const { fromUserId, toUserId } = dto;

    if (fromUserId === toUserId)
      return {
        status: BAD_REQUEST,
        result: new TransferErrors.SameFromAndTo(fromUserId),
      };

    {
      const guardUuid = Guard.isUuid(
        fromUserId,
        new CreateTransactionErrors.UserIdNotUuid(fromUserId)
      );
      if (guardUuid.isFailure)
        return {
          status: BAD_REQUEST,
          result: guardUuid.error as BaseError,
        };
    }
    {
      const guardUuid = Guard.isUuid(
        toUserId,
        new TransferErrors.UserIdNotUuid(toUserId)
      );
      if (guardUuid.isFailure)
        return {
          status: BAD_REQUEST,
          result: guardUuid.error as BaseError,
        };
    }

    const fromAccount = await this.accountRepo.getAccountByUserId(fromUserId);
    if (!fromAccount)
      return {
        status: BAD_REQUEST,
        result: new TransferErrors.FromAccountNotFound(fromUserId),
      };

    const toAccount = await this.accountRepo.getAccountByUserId(toUserId);
    if (!toAccount)
      return {
        status: BAD_REQUEST,
        result: new TransferErrors.ToAccountNotFound(toUserId),
      };

    const transferOrError = new AccountService().transfer({
      delta,
      fromAccount,
      fromDescription,
      toAccount,
      toDescription,
    });
    if (transferOrError.isFailure)
      return {
        status: BAD_REQUEST,
        result: new TransferErrors.InvalidTransfer(
          transferOrError.error as BaseError
        ),
      };
    const { fromTransaction, toTransaction } = transferOrError.value;

    await this.accountRepo.transfer({
      from: {
        transaction: fromTransaction,
        accountId: fromAccount.id.toString(),
      },
      to: {
        transaction: toTransaction,
        accountId: toAccount.id.toString(),
      },
    });

    return {
      status: CREATED,
      result: {
        fromTransaction: fromTransaction.id.toString(),
        toTransaction: toTransaction.id.toString(),
      },
    };
  }
}
