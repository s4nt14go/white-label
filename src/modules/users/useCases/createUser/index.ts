import { CreateUserController } from './CreateUserController';
import setHooks from '../../../../shared/infra/database/sequelize/hooks';
import models from '../../../../shared/infra/database/sequelize/models';
import { UserRepo } from '../../repos/UserRepo';
import { DispatcherLambda } from '../../../../shared/infra/dispatchEvents/DispatcherLambda';

setHooks();
const dispatcher = new DispatcherLambda();
const repo = new UserRepo(models);
const controller = new CreateUserController(repo, dispatcher, models.getTransaction);
export const handler = controller.execute.bind(controller);
