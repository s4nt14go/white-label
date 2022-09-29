import { NotifyTransactionCreated } from '../../../../shared/infra/appsync/schema.graphql';

export interface IFeService {
  transactionCreated(data: NotifyTransactionCreated): void;
}