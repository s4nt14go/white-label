import { Request, Response } from './GetAccountByUserIdDTOs';
import { IAccountRepo } from '../../repos/IAccountRepo';
import { Guard } from '../../../../shared/core/Guard';
import { GetAccountByUserIdErrors } from './GetAccountByUserIdErrors';
import { AccountMap } from '../../mappers/AccountMap';
import { BaseError } from '../../../../shared/core/AppError';
import { Status } from '../../../../shared/core/Status';
import { ControllerResult } from '../../../../shared/core/ControllerResult';
import { AppSyncController } from '../../../../shared/infra/appsync/AppSyncController';

const { OK, BAD_REQUEST } = Status;

export class GetAccountByUserId extends AppSyncController<Request, Response> {
  private readonly accountRepo: IAccountRepo;

  public constructor(accountRepo: IAccountRepo) {
    super();
    this.accountRepo = accountRepo;
  }

  protected async executeImpl(dto: Request): ControllerResult<Response> {
    const { userId } = dto;

    const guardUuid = Guard.isUuid(
      userId,
      new GetAccountByUserIdErrors.UserIdNotUuid(userId)
    );
    if (guardUuid.isFailure)
      return {
        status: BAD_REQUEST,
        result: guardUuid.error as BaseError,
      };

    const account = await this.accountRepo.getAccountByUserId(userId);
    if (!account)
      return {
        status: BAD_REQUEST,
        result: new GetAccountByUserIdErrors.AccountNotFound(userId),
      };

    return { status: OK, result: AccountMap.toClient(account) };
  }
}
