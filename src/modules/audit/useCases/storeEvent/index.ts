import { EventStorage } from '../../../../shared/infra/dynamo/EventStorage';
import { StoreEvent } from './StoreEvent';

const { StorageTable } = process.env;
if (!StorageTable) {
  console.log('process.env', process.env);
  throw new Error(`Undefined env var!`);
}

const storage = new EventStorage(StorageTable);
const useCase = new StoreEvent(storage);
export const handler = useCase.execute.bind(useCase);
