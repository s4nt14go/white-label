// eslint-disable-next-line @typescript-eslint/no-var-requires
const models = require('../../../../shared/infra/database/sequelize/models/index.ts');
import { Transfer } from './Transfer';
import { AccountRepo } from '../../repos/AccountRepo';
import setHooks from '../../../../shared/infra/database/sequelize/hooks';
import { DispatcherLambda } from '../../../../shared/infra/dispatchEvents/DispatcherLambda';

setHooks();
const dispatcher = new DispatcherLambda();
const repo = new AccountRepo(models);
const controller = new Transfer(
  repo,
  dispatcher,
  models.renewConn,
  models.getTransaction
);
export const handler = controller.execute.bind(controller);
