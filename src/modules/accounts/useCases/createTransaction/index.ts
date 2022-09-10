import { CreateTransaction } from './CreateTransaction';
import models from '../../../../shared/infra/database/sequelize/models';
import { AccountRepo } from '../../repos/AccountRepo';

const repo = new AccountRepo(models);
const controller = new CreateTransaction(repo, models.getTransaction);
export const handler = controller.execute.bind(controller);
