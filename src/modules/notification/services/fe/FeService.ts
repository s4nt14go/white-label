import { IFeClient } from './IFeClient';
import { IFeService } from './IFeService';

export class FeService implements IFeService {
  private client: IFeClient;

  public constructor(client: IFeClient) {
    this.client = client;
  }

  public async transactionCreated(data: unknown) {
    await this.client.send({
      query: `mutation ($data: NotifyTransactionCreatedInput!) {
        notifyTransactionCreated(data: $data) {
          accountId
          id
          balance
          delta
          date
          description
          response_time
        }
      }`,
      variables: data,
    });
  }
}
