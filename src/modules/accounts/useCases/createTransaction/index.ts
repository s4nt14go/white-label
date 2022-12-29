// eslint-disable-next-line @typescript-eslint/no-var-requires
const models = require('../../../../shared/infra/database/sequelize/models/index.ts');
import { ReturnUnexpectedError } from '../../../../shared/decorators/ReturnUnexpectedError';
import { Transaction } from '../../../../shared/decorators/Transaction';
import { CreateTransaction } from './CreateTransaction';
import { AccountRepo } from '../../repos/AccountRepo';
import setHooks from '../../../../shared/infra/database/sequelize/hooks';
import { LambdaInvoker } from '../../../../shared/infra/invocation/LambdaInvoker';
import { DBretry } from '../../../../shared/decorators/DBretry';
import { DBretryTable } from '../../../../shared/decorators/DBretryTable';

setHooks();
const invoker = new LambdaInvoker();
const repo = new AccountRepo(models);
const controller = new CreateTransaction(
  repo,
  invoker
);

const decorated1 = new Transaction(controller, models.getTransaction, [repo]);
const decorated2 = new DBretry(decorated1, new DBretryTable(), models.renewConn, __filename);
const decorated3 = new ReturnUnexpectedError(decorated2);
export const handler = decorated3.execute.bind(decorated3);
