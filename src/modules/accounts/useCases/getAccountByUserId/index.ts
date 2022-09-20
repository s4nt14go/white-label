import { GetAccountByUserId } from './GetAccountByUserId';
import models from '../../../../shared/infra/database/sequelize/models';
import { AccountRepo } from '../../repos/AccountRepo';

const repo = new AccountRepo(models);
const controller = new GetAccountByUserId(repo, models.renewConn);
export const handler = controller.execute.bind(controller);
