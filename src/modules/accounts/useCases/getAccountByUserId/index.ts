// eslint-disable-next-line @typescript-eslint/no-var-requires
const models = require('../../../../shared/infra/database/sequelize/models/index.ts');
import { GetAccountByUserId } from './GetAccountByUserId';
import { AccountRepo } from '../../repos/AccountRepo';
import { ReturnUnexpectedError } from '../../../../shared/decorators/ReturnUnexpectedError';
import { DBretry } from '../../../../shared/decorators/DBretry';

const repo = new AccountRepo(models);
const controller = new GetAccountByUserId(repo);

const decorated1 = new DBretry(controller);
const decorated2 = new ReturnUnexpectedError(decorated1);
export const handler = decorated2.execute.bind(decorated2);
