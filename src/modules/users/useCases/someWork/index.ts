import { SomeWork } from './SomeWork';
import { externalService } from '../../services';

const useCase = new SomeWork(externalService);
export const handler = useCase.execute.bind(useCase);
