import { NotifyFE } from './NotifyFE';
import { FeService } from '../../services/fe/FeService';
import { AppSyncClient } from '../../../../shared/infra/appsync/AppSyncClient';

const appsyncClient = new AppSyncClient();
const feService = new FeService(appsyncClient);
const useCase = new NotifyFE(feService);
export const handler = useCase.execute.bind(useCase);
