import { CreateUserController } from './CreateUserController';
import { UserRepoDynamo } from '../../repos/implementations/dynamo';
import { Dispatcher } from '../../../../core/infra/Dispatcher';

const repo = new UserRepoDynamo();
const controller = new CreateUserController(repo, new Dispatcher());
export const handler = controller.execute.bind(controller);
