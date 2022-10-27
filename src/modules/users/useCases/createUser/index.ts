// eslint-disable-next-line @typescript-eslint/no-var-requires
const models = require('../../../../shared/infra/database/sequelize/models/index.ts');
import { CreateUser } from './CreateUser';
import setHooks from '../../../../shared/infra/database/sequelize/hooks';
import { UserRepo } from '../../repos/UserRepo';
import { DispatcherLambda } from '../../../../shared/infra/dispatchEvents/DispatcherLambda';

setHooks();
const dispatcher = new DispatcherLambda();
const repo = new UserRepo(models);
const controller = new CreateUser(
  repo,
  dispatcher,
  models.renewConn,
  models.getTransaction
);
export const handler = controller.execute.bind(controller);
