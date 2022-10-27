// eslint-disable-next-line @typescript-eslint/no-var-requires
const models = require('../../../../shared/infra/database/sequelize/models/index.ts');
import { CreateAccount } from './CreateAccount';
import { AccountRepo } from '../../repos/AccountRepo';

const repo = new AccountRepo(models);
const controller = new CreateAccount(
  repo,
  models.renewConn,
  models.getTransaction
);
export const handler = controller.execute.bind(controller);
