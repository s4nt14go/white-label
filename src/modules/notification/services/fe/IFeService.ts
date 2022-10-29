import { NotifyTransactionCreatedData } from '../../../../shared/infra/appsync/schema.graphql';

export interface IFeService {
  transactionCreated(data: NotifyTransactionCreatedData): void;
}
