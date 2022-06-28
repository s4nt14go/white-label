import { CreateUserController } from './CreateUserController';
import { UserRepoDynamo } from '../../repos/UserRepoDynamo';
import { DispatcherLambda } from '../../../../core/infra/dispatchEvents/DispatcherLambda';
import { UnitOfWorkDynamo } from '../../../../core/infra/unitOfWork/UnitOfWorkDynamo';

const unitOfWork = new UnitOfWorkDynamo();
const dispatcher = new DispatcherLambda();
const repo = new UserRepoDynamo(unitOfWork);
const controller = new CreateUserController(unitOfWork, repo, dispatcher);
export const handler = controller.execute.bind(controller);
