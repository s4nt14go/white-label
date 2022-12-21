// eslint-disable-next-line @typescript-eslint/no-var-requires
const models = require('../../../../shared/infra/database/sequelize/models/index.ts');
import { Transaction } from '../../../../shared/decorators/Transaction';
import { DBretry } from '../../../../shared/decorators/DBretry';
import { Transfer } from './Transfer';
import { AccountRepo } from '../../repos/AccountRepo';
import setHooks from '../../../../shared/infra/database/sequelize/hooks';
import { LambdaInvoker } from '../../../../shared/infra/invocation/LambdaInvoker';
import { ReturnUnexpectedError } from '../../../../shared/decorators/ReturnUnexpectedError';

setHooks();
const invoker = new LambdaInvoker();
const repo = new AccountRepo(models);
const controller = new Transfer(repo, invoker);

const decorated1 = new Transaction(controller, models.getTransaction, [repo]);
const decorated2 = new DBretry(decorated1);
const decorated3 = new ReturnUnexpectedError(decorated2);
export const handler = decorated3.execute.bind(decorated3);
