import { SomeWork } from "./SomeWork";
import { SomeWorkController } from './SomeWorkController';
import { externalService } from '../../services';

const useCase = new SomeWork(externalService)
const controller = new SomeWorkController(useCase);
export const handler = controller.executeImpl.bind(controller);