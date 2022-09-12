import { APIGatewayController } from '../../../../shared/infra/http/APIGatewayController';
import { TransferDTO } from './TransferDTO';
import { IAccountRepo } from '../../repos/IAccountRepo';
import { TransferErrors } from './TransferErrors';
import { Amount } from '../../domain/Amount';
import { BaseError } from '../../../../shared/core/AppError';
import { Description } from '../../domain/Description';
import { Guard } from '../../../../shared/core/Guard';

export class Transfer extends APIGatewayController {
  private readonly accountRepo: IAccountRepo;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public constructor(accountRepo: IAccountRepo, getTransaction: any) {
    super(getTransaction);
    this.accountRepo = accountRepo;
  }

  protected async executeImpl(dto: TransferDTO) {
    // As this use case is a command, include all repos queries in a serializable transaction
    this.accountRepo.setTransaction(this.transaction);

    const descriptionOrError = Description.create({ value: dto.fromDescription });
    if (descriptionOrError.isFailure)
      return this.fail(
        new TransferErrors.FromDescriptionInvalid(
          descriptionOrError.error as BaseError
        )
      );
    const fromDescription = descriptionOrError.value;

    let toDescription: Description;
    if (dto.toDescription === undefined) {
      toDescription = fromDescription;
    } else {
      const descriptionOrError = Description.create({ value: dto.toDescription });
      if (descriptionOrError.isFailure)
        return this.fail(
          new TransferErrors.ToDescriptionInvalid(
            descriptionOrError.error as BaseError
          )
        );
      toDescription = descriptionOrError.value;
    }

    const deltaOrError = Amount.create({ value: dto.quantity });
    if (deltaOrError.isFailure)
      return this.fail(
        new TransferErrors.QuantityInvalid(deltaOrError.error as BaseError)
      );
    const delta = deltaOrError.value;

    const { fromUserId, toUserId } = dto;
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
      const combined = Guard.combine([guardNull, guardType]);
      if (combined.isFailure) return this.fail(combined.error);
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
      const combined = Guard.combine([guardNull, guardType]);
      if (combined.isFailure) return this.fail(combined.error);
    }

    const fromAccount = await this.accountRepo.getAccountByUserId(fromUserId);
    if (!fromAccount)
      return this.fail(new TransferErrors.FromAccountNotFound(fromUserId));

    const toAccount = await this.accountRepo.getAccountByUserId(toUserId);
    if (!toAccount)
      return this.fail(new TransferErrors.ToAccountNotFound(toUserId));

    const transferOrError = fromAccount.transferTo(
      toAccount,
      delta,
      fromDescription,
      toDescription
    );
    if (transferOrError.isFailure)
      return this.fail(
        new TransferErrors.InvalidTransfer(transferOrError.error as BaseError)
      );
    const { fromTransaction, toTransaction } = transferOrError.value;

    await this.accountRepo.transfer({
      from: {
        transaction: fromTransaction,
        userId: fromUserId,
      },
      to: {
        transaction: toTransaction,
        userId: toUserId,
      },
    });

    return this.created();
  }
}
