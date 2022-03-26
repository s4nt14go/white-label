import { CreateUserController } from "./CreateUserController";
import { UserRepoFake } from "../../repos/implementations/fake";
import { CreateUserUseCase } from "./CreateUserUseCase";
import { Dispatcher } from '../../../../core/infra/Dispatcher';

const repo = new UserRepoFake();
const useCase = new CreateUserUseCase(repo, new Dispatcher());
const controller = new CreateUserController(
    useCase
)
export const handler = controller.execute.bind(controller);