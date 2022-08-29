import { BaseController } from '../../../../shared/core/BaseController';
import { CreateUserDTO } from './CreateUserDTO';
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

export class CreateUserController extends BaseController {
  private readonly userRepo: IUserRepo;

  constructor(userRepo: IUserRepo, dispatcher: IDispatcher) {
    super();
    this.userRepo = userRepo;
    CreateUserEvents.registration(dispatcher);
  }

  async executeImpl(dto: CreateUserDTO) {
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

    return this.created();
  }
}
