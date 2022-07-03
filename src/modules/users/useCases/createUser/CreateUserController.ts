import { BaseController } from '../../../../core/infra/BaseController';
import { CreateUserDTO } from './CreateUserDTO';
import { CreateUserErrors } from './CreateUserErrors';
import { UserEmail } from '../../domain/userEmail';
import { UserPassword } from '../../domain/userPassword';
import { UserName } from '../../domain/userName';
import { Result } from '../../../../core/logic/Result';
import { User } from '../../domain/user';
import { IUserRepo } from '../../repos/IUserRepo';
import { IDispatcher } from '../../../../core/domain/events/DomainEvents';
import { CreateUserEvents } from './CreateUserEvents';
import { Alias } from '../../domain/alias';
import { UnitOfWork } from '../../../../core/infra/unitOfWork/UnitOfWork';

export class CreateUserController extends BaseController {
  private readonly unitOfWork: UnitOfWork;
  private readonly userRepo: IUserRepo;

  constructor(
    unitOfWork: UnitOfWork,
    userRepo: IUserRepo,
    dispatcher: IDispatcher
  ) {
    super();
    this.unitOfWork = unitOfWork;
    this.userRepo = userRepo;
    CreateUserEvents.registration(dispatcher);
  }

  async executeImpl(dto: CreateUserDTO) {
    this.unitOfWork.clear();

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

    if (dtoResult.isFailure) {
      return this.fail(dtoResult.error);
    }
    const email = emailOrError.value;
    const password = passwordOrError.value;
    const username = usernameOrError.value;
    const alias = aliasOrError.value;

    const emailAlreadyTaken = await this.userRepo.exists(email);
    if (emailAlreadyTaken)
      return this.conflict(new CreateUserErrors.EmailAlreadyTaken(email.value));

    const usernameAlreadyTaken = await this.userRepo.findUserByUsername(
      username.value
    );
    if (usernameAlreadyTaken)
      return this.conflict(
        new CreateUserErrors.UsernameAlreadyTaken(username.value)
      );

    const user = User.create({
      email,
      password,
      username,
      alias,
    });

    await this.userRepo.save(user);

    await this.unitOfWork.commit();
    await CreateUserEvents.dispatchEventsForAggregates(user.id);

    return this.created();
  }
}
