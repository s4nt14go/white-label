import DynamoDB = require('aws-sdk/clients/dynamodb');
import { UnitOfWork } from './UnitOfWork';

const DocumentClient = new DynamoDB.DocumentClient();

/** Write on commit the added transactions to DynamoDB */
export class UnitOfWorkDynamo extends UnitOfWork {
  async commit() {
    await DocumentClient.transactWrite({
      TransactItems: this.transactions,
    }).promise();
  }
}
