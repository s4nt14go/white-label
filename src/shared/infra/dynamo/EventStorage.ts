import DynamoDB from 'aws-sdk/clients/dynamodb';
import {
  IStorage,
  TransactionCreatedEventStored,
  UserCreatedEventStored,
} from '../../../modules/audit/services/IStorage';

const DocumentClient = new DynamoDB.DocumentClient();

export class EventStorage implements IStorage {
  private readonly table: string;

  public constructor(table: string) {
    this.table = table;
  }

  public async saveEvent(
    eventStored: UserCreatedEventStored | TransactionCreatedEventStored
  ) {
    const { type, aggregateId, dateTimeOccurred, ...rest } = eventStored;
    const Item = {
      typeAggregateId: `${type}#${aggregateId}`,
      dateTimeOccurred,
      type,
      aggregateId,
      ...rest,
    };
    await DocumentClient.put({
      TableName: this.table,
      Item,
      ConditionExpression: 'attribute_not_exists(dateTimeOccurred)',
    }).promise();
  }
}
