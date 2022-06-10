import { BaseController } from '../../../../core/infra/BaseController';
import { CreateUserDTO } from './CreateUserDTO';
import { CreateUserErrors } from './CreateUserErrors';
import { UserEmail } from '../../domain/userEmail';
import { UserPassword } from '../../domain/userPassword';
import { UserName } from '../../domain/userName';
import { Result } from '../../../../core/logic/Result';
import { User } from '../../domain/user';
import { IUserRepo } from '../../repos/userRepo';
import { IDispatcher } from '../../../../core/domain/events/DomainEvents';
import { CreateUserEvents } from './CreateUserEvents';

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

    const dtoResult = Result.combine([
      emailOrError,
      passwordOrError,
      usernameOrError,
    ]);

    if (dtoResult.isFailure) {
      return this.fail(dtoResult.error);
    }

    const email = emailOrError.value as UserEmail;
    const password = passwordOrError.value as UserPassword;
    const username = usernameOrError.value as UserName;

    const emailAlreadyTaken = await this.userRepo.exists(email);
    if (emailAlreadyTaken)
      return this.conflict(new CreateUserErrors.EmailAlreadyTaken(email.value));

    const usernameAlreadyTaken = await this.userRepo.findUserByUsername(
      username.props.name
    );
    if (usernameAlreadyTaken)
      return this.conflict(
        new CreateUserErrors.UsernameAlreadyTaken(username.value)
      );

    const user = User.create({
      email,
      password,
      username,
    });

    await this.userRepo.save(user);

    return this.created();
  }
}
