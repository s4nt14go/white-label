import models from '../../../../shared/infra/database/sequelize/models';
import { CreateAccount } from './CreateAccount';
import { AccountRepo } from '../../repos/AccountRepo';

const repo = new AccountRepo(models);
const controller = new CreateAccount(repo, models.getTransaction);
export const handler = controller.execute.bind(controller);
