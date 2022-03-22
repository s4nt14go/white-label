
import { CreateUserController } from "./CreateUserController";
import { UserRepoFake } from "../../repos/implementations/fake";
import { CreateUserUseCase } from "./CreateUserUseCase";
import './../../../loadSubscribers';


const userRepoFake = new UserRepoFake();
const createUserUseCase = new CreateUserUseCase(userRepoFake);
const createUserController = new CreateUserController(
  createUserUseCase
)
const handler = createUserController.execute.bind(createUserController);

export {
  createUserUseCase,
  createUserController,
  handler,
}