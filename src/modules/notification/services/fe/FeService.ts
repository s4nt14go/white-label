import { IFeClient } from './IFeClient';
import { IFeService } from './IFeService';
import gql from 'graphql-tag';
import { NotifyTransactionCreated } from '../../../../shared/infra/appsync/schema.graphql';

export class FeService implements IFeService {
  private client: IFeClient;

  public constructor(client: IFeClient) {
    this.client = client;
  }

  public async transactionCreated(data: NotifyTransactionCreated) {
    await this.client.send({
      query: gql`
        mutation ($data: NotifyTransactionCreatedInput!) {
          notifyTransactionCreated(data: $data) {
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
      variables: { data },
    });
  }
}
