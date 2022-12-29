// eslint-disable-next-line @typescript-eslint/no-var-requires
const models = require('../../../../shared/infra/database/sequelize/models/index.ts');
import { Transaction } from '../../../../shared/decorators/Transaction';
import { DBretry } from '../../../../shared/decorators/DBretry';

import { CreateAccount } from './CreateAccount';
import { AccountRepo } from '../../repos/AccountRepo';
import { DBretryTable } from '../../../../shared/decorators/DBretryTable';

const repo = new AccountRepo(models);
const controller = new CreateAccount(repo);

const decorated1 = new Transaction(controller, models.getTransaction, [repo]);
const decorated2 = new DBretry(decorated1, new DBretryTable(), models.renewConn, __filename);
export const handler = decorated2.execute.bind(decorated2);
