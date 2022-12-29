// eslint-disable-next-line @typescript-eslint/no-var-requires
const models = require('../../../../shared/infra/database/sequelize/models/index.ts');
import { Transaction } from '../../../../shared/decorators/Transaction';
import { DBretry } from '../../../../shared/decorators/DBretry';
import { CreateUser } from './CreateUser';
import setHooks from '../../../../shared/infra/database/sequelize/hooks';
import { UserRepo } from '../../repos/UserRepo';
import { LambdaInvoker } from '../../../../shared/infra/invocation/LambdaInvoker';
import { ReturnUnexpectedError } from '../../../../shared/decorators/ReturnUnexpectedError';
import { DBretryTable } from '../../../../shared/decorators/DBretryTable';

setHooks();
const invoker = new LambdaInvoker();
const repo = new UserRepo(models);
const controller = new CreateUser(repo, invoker);

const decorated1 = new Transaction(controller, models.getTransaction, [repo]);
const decorated2 = new DBretry(decorated1, new DBretryTable(), models.renewConn, __filename);
const decorated3 = new ReturnUnexpectedError(decorated2);
export const handler = decorated3.execute.bind(decorated3);
