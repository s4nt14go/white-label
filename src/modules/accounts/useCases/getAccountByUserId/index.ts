// eslint-disable-next-line @typescript-eslint/no-var-requires
const models = require('../../../../shared/infra/database/sequelize/models/index.ts');
import { GetAccountByUserId } from './GetAccountByUserId';
import { AccountRepo } from '../../repos/AccountRepo';
import { ReturnUnexpectedError } from '../../../../shared/decorators/ReturnUnexpectedError';
import { DBretry } from '../../../../shared/decorators/DBretry';
import { DBretryTable } from '../../../../shared/decorators/DBretryTable';
import { GetAccountByUserIdCache as Cache } from './GetAccountByUserIdCache';

const repo = new AccountRepo(models);
const controller = new GetAccountByUserId(repo);

const decorated1 = new DBretry(controller, new DBretryTable(), models.renewConn, __filename);
const decorated2 = new Cache(decorated1);
const decorated3 = new ReturnUnexpectedError(decorated2);
export const handler = decorated3.execute.bind(decorated3);
