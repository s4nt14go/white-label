import { CreateUserController } from './CreateUserController';
import setHooks from '../../../../shared/sequelize/hooks';
import models from '../../../../shared/sequelize/models';
import { UserRepo } from '../../repos/UserRepo';
import { DispatcherLambda } from '../../../../core/infra/dispatchEvents/DispatcherLambda';

setHooks();
const dispatcher = new DispatcherLambda();
const repo = new UserRepo(models);
const controller = new CreateUserController(repo, dispatcher);
export const handler = controller.execute.bind(controller);
