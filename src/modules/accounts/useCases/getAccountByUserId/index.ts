// eslint-disable-next-line @typescript-eslint/no-var-requires
const models = require('../../../../shared/infra/database/sequelize/models/index.ts');
import { GetAccountByUserId } from './GetAccountByUserId';
import { AccountRepo } from '../../repos/AccountRepo';

const repo = new AccountRepo(models);
const controller = new GetAccountByUserId(repo, models.renewConn);
export const handler = controller.execute.bind(controller);
