import { AppSyncController } from '../../../../shared/infra/appsync/AppSyncController';
import { Request, Response } from './CreateUserDTOs';
import { CreateUserErrors } from './CreateUserErrors';
import { UserEmail } from '../../domain/UserEmail';
import { UserPassword } from '../../domain/UserPassword';
import { UserName } from '../../domain/UserName';
import { Result } from '../../../../shared/core/Result';
import { User } from '../../domain/User';
import { IUserRepo } from '../../repos/IUserRepo';
import { IDispatcher } from '../../../../shared/domain/events/DomainEvents';
import { CreateUserEvents } from './CreateUserEvents';
import { Alias } from '../../domain/Alias';
import { ControllerResultAsync } from '../../../../shared/core/BaseController';
import { Status } from '../../../../shared/core/Status';
import { BaseError } from '../../../../shared/core/AppError';
const { BAD_REQUEST, CREATED, CONFLICT } = Status;

export class CreateUser extends AppSyncController<Request, Response> {
  private readonly userRepo: IUserRepo;
  public constructor(
    userRepo: IUserRepo,
    dispatcher: IDispatcher,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renewConn: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getTransaction: any
  ) {
    super(renewConn, getTransaction);
    this.userRepo = userRepo;
    CreateUserEvents.registration(dispatcher);
  }

  protected async executeImpl(dto: Request): ControllerResultAsync<Response> {
    // As this use case is a command, include all repos queries in a serializable transaction
    this.userRepo.setTransaction(this.transaction);

    const emailOrError = UserEmail.create(dto.email);
    const passwordOrError = UserPassword.create({ value: dto.password });
    const usernameOrError = UserName.create({ name: dto.username });
    const aliasOrError = Alias.create({ value: dto.alias });

    const dtoResult = Result.combine([
      emailOrError,
      passwordOrError,
      usernameOrError,
      aliasOrError,
    ]);

    if (dtoResult.isFailure)
      return { status: BAD_REQUEST, result: dtoResult.error as BaseError };
    const email = emailOrError.value;
    const password = passwordOrError.value;
    const username = usernameOrError.value;
    const alias = aliasOrError.value;

    const emailAlreadyTaken = await this.userRepo.exists(email);
    if (emailAlreadyTaken)
      return {
        status: CONFLICT,
        result: new CreateUserErrors.EmailAlreadyTaken(email.value),
      };

    const usernameAlreadyTaken = await this.userRepo.findUserByUsername(
      username.value
    );
    if (usernameAlreadyTaken)
      return {
        status: CONFLICT,
        result: new CreateUserErrors.UsernameAlreadyTaken(username.value),
      };

    const user = User.create({
      email,
      password,
      username,
      alias,
    });

    await this.userRepo.create(user);

    return { status: CREATED, result: { id: user.id.toString() } };
  }
}
