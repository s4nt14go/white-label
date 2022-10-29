import { IFeClient } from './IFeClient';
import { IFeService } from './IFeService';
import gql from 'graphql-tag';
import { NotifyTransactionCreatedData } from '../../../../shared/infra/appsync/schema.graphql';
import { NotificationTypes } from '../../domain/NotificationTypes';
import { NotificationTargets } from '../../domain/NotificationTargets';

export class FeService implements IFeService {
  private client: IFeClient;

  public constructor(client: IFeClient) {
    this.client = client;
  }

  public async transactionCreated(data: NotifyTransactionCreatedData) {
    await this.client.send({
      query: gql`
        mutation ($data: NotifyTransactionCreatedInput!) {
          notifyTransactionCreated(data: $data) {
            target
            type
            accountId
            transaction {
              id
              balance
              delta
              date
              description
            }
          }
        }
      `,
      variables: {
        data: {
          ...data,
          target: NotificationTargets.FE,
          type: NotificationTypes.TransactionCreated,
        },
      },
    });
  }
}
