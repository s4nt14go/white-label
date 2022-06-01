import { CreateUserController } from "./CreateUserController";
import { UserRepoFake } from "../../repos/implementations/fake";
import { Dispatcher } from '../../../../core/infra/Dispatcher';

const repo = new UserRepoFake();
const controller = new CreateUserController(
    repo, new Dispatcher()
)
export const handler = controller.execute.bind(controller);