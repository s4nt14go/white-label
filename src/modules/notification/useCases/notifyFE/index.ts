import { NotifyFE } from './NotifyFE';
import { feService } from '../../services/fe';

const useCase = new NotifyFE(feService);
export const handler = useCase.execute.bind(useCase);
