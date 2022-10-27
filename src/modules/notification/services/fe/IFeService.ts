import { NotifyTransactionCreatedInput } from '../../../../shared/infra/appsync/schema.graphql';

export interface IFeService {
  transactionCreated(data: NotifyTransactionCreatedInput): void;
}
