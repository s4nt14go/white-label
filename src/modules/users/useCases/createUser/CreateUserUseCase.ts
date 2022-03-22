
import { UseCase } from "../../../../core/domain/UseCase";
import { CreateUserDTO } from "./CreateUserDTO";
import { Either, Result, left, right } from "../../../../core/logic/Result";
import { UserEmail } from "../../domain/userEmail";
import { UserPassword } from "../../domain/userPassword";
import { User } from "../../domain/user";
import { IUserRepo } from "../../repos/userRepo";
import { CreateUserErrors } from "./CreateUserErrors";
import { AppError } from "../../../../core/logic/AppError";
import { UserName } from '../../domain/userName';

type Response = Either<
    CreateUserErrors.EmailAlreadyExistsError |
    CreateUserErrors.UsernameTakenError |
    AppError.UnexpectedError |
    Result<any>,
    Result<void>
    >

export class CreateUserUseCase implements UseCase<CreateUserDTO, Promise<Response>> {
  private userRepo: IUserRepo;

  constructor (userRepo: IUserRepo) {
    this.userRepo = userRepo;
  }

  async execute (request: CreateUserDTO): Promise<Response> {
    const emailOrError = UserEmail.create(request.email);
    const passwordOrError = UserPassword.create({ value: request.password });
    const usernameOrError = UserName.create({ name: request.username });

    const dtoResult = Result.combine([
      emailOrError, passwordOrError, usernameOrError
    ]);

    if (dtoResult.isFailure) {
      return left(Result.fail<void>(dtoResult.error)) as Response;
    }

    const email = emailOrError.getValue() as UserEmail;
    const password = passwordOrError.getValue() as UserPassword;
    const username = usernameOrError.getValue() as UserName;

    try {
      const userAlreadyExists = await this.userRepo.exists(email);

      if (userAlreadyExists) {
        return left(
            new CreateUserErrors.EmailAlreadyExistsError(email.value)
        ) as Response;
      }

      try {
        const alreadyCreatedUserByUserName = await this.userRepo
            .findUserByUsername(username);

        const userNameTaken = !!alreadyCreatedUserByUserName;

        if (userNameTaken) {
          return left (
              new CreateUserErrors.UsernameTakenError(username.value)
          ) as Response;
        }
      } catch (err) {}


      const userOrError: Result<User> = User.create({
        email, password, username,
      });

      if (userOrError.isFailure) {
        const error = userOrError.error ? userOrError.error.toString() : userOrError.error;
        return left(
            Result.fail<User>(error)
        ) as Response;
      }

      const user = userOrError.getValue() as User;

      await this.userRepo.save(user);

      return right(Result.ok<void>())

    } catch (err) {
      return left(new AppError.UnexpectedError(err)) as Response;
    }
  }
}