import { AppSyncController } from '../../../../shared/infra/appsync/AppSyncController';
import { Request, Response } from './TransferDTO';
import { IAccountRepo } from '../../repos/IAccountRepo';
import { TransferErrors } from './TransferErrors';
import { AccountService } from '../../services/AccountService';
import { Amount } from '../../domain/Amount';
import { BaseError } from '../../../../shared/core/AppError';
import { Description } from '../../domain/Description';
import { Guard } from '../../../../shared/core/Guard';
import { CreateTransactionErrors } from '../createTransaction/CreateTransactionErrors';
import { ControllerResultAsync } from '../../../../shared/core/BaseController';
import { Status } from '../../../../shared/core/Status';
import { IDispatcher } from '../../../../shared/domain/events/DomainEvents';
import { CreateTransactionEvents } from '../createTransaction/CreateTransactionEvents';
const { CREATED, BAD_REQUEST } = Status;

export class Transfer extends AppSyncController<Request, Response> {
  private readonly accountRepo: IAccountRepo;

  public constructor(
    accountRepo: IAccountRepo,
    dispatcher: IDispatcher,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renewConn: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getTransaction: any
  ) {
    super(renewConn, getTransaction);
    this.accountRepo = accountRepo;
    CreateTransactionEvents.registration(dispatcher);
  }

  protected async executeImpl(dto: Request): ControllerResultAsync<Response> {
    // As this use case is a command, include all repos queries in a serializable transaction
    this.accountRepo.setTransaction(this.transaction);

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
      const guardNull = Guard.againstNullOrUndefined(
        fromUserId,
        new TransferErrors.FromUserIdNotDefined()
      );
      const guardType = Guard.isType(
        fromUserId,
        'string',
        new TransferErrors.FromUserIdNotString(typeof fromUserId)
      );
      const guardUuid = Guard.isUuid(
        fromUserId,
        new CreateTransactionErrors.UserIdNotUuid(fromUserId)
      );
      const combined = Guard.combine([guardNull, guardType, guardUuid]);
      if (combined.isFailure)
        return {
          status: BAD_REQUEST,
          result: combined.error as BaseError,
        };
    }
    {
      const guardNull = Guard.againstNullOrUndefined(
        toUserId,
        new TransferErrors.ToUserIdNotDefined()
      );
      const guardType = Guard.isType(
        toUserId,
        'string',
        new TransferErrors.ToUserIdNotString(typeof toUserId)
      );
      const guardUuid = Guard.isUuid(
        toUserId,
        new TransferErrors.UserIdNotUuid(toUserId)
      );
      const combined = Guard.combine([guardNull, guardType, guardUuid]);
      if (combined.isFailure)
        return {
          status: BAD_REQUEST,
          result: combined.error as BaseError,
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
