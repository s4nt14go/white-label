import { Request, Response } from './GetAccountByUserIdDTO';
import { IAccountRepo } from '../../repos/IAccountRepo';
import { Guard } from '../../../../shared/core/Guard';
import { GetAccountByUserIdErrors } from './GetAccountByUserIdErrors';
import { AccountMap } from '../../mappers/AccountMap';
import { BaseError } from '../../../../shared/core/AppError';
import { Status } from '../../../../shared/core/Status';
import { ControllerResultAsync } from '../../../../shared/core/BaseController';
import { AppSyncController } from '../../../../shared/infra/appsync/AppSyncController';

const { OK, BAD_REQUEST } = Status;

export class GetAccountByUserId extends AppSyncController<Response, Request> {
  private readonly accountRepo: IAccountRepo;

  public constructor(accountRepo: IAccountRepo) {
    super();
    this.accountRepo = accountRepo;
  }

  protected async executeImpl(dto: Request): ControllerResultAsync<Response> {
    const { userId } = dto;

    const guardNull = Guard.againstNullOrUndefined(
      userId,
      new GetAccountByUserIdErrors.UserIdNotDefined()
    );
    const guardType = Guard.isType(
      userId,
      'string',
      new GetAccountByUserIdErrors.UserIdNotString(typeof userId)
    );
    const guardUuid = Guard.isUuid(
      userId,
      new GetAccountByUserIdErrors.UserIdNotUuid(userId)
    );
    const combined = Guard.combine([guardNull, guardType, guardUuid]);
    if (combined.isFailure)
      return { status: BAD_REQUEST, result: combined.error as BaseError };

    const account = await this.accountRepo.getAccountByUserId(userId);
    if (!account)
      return {
        status: BAD_REQUEST,
        result: new GetAccountByUserIdErrors.AccountNotFound(userId),
      };

    return { status: OK, result: AccountMap.toClient(account) };
  }
}
