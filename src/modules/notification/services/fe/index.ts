import { AppSyncClient } from '../../../../shared/infra/appsync/AppSyncClient';
import { FeService } from './FeService';

export const feService = new FeService(new AppSyncClient());
