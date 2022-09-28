// eslint-disable-next-line @typescript-eslint/no-var-requires
const models = require('../../../../shared/infra/database/sequelize/models/index.ts');
import { Transfer } from './Transfer';
import { AccountRepo } from '../../repos/AccountRepo';

const repo = new AccountRepo(models);
const controller = new Transfer(repo, models.renewConn, models.getTransaction);
export const handler = controller.execute.bind(controller);
