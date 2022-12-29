import DynamoDB from 'aws-sdk/clients/dynamodb';
import { Context } from 'aws-lambda';

const DocumentClient = new DynamoDB.DocumentClient();

export class DBretryTable {
  private DBretryTable: string;

  public constructor() {
    // Add all process.env used:
    const { DBretryTable } = process.env;
    if (!DBretryTable) {
      console.log('process.env', process.env);
      throw new Error(`Undefined env var!`);
    }
    this.DBretryTable = DBretryTable;
  }

  public getFailNumber = async (retryToken: string) => {
    const { Item } = await DocumentClient.get({
      TableName: this.DBretryTable,
      Key: {
        retryToken,
      },
    }).promise();
    return Item?.failNumber ?? 0;
  };

  public setFailNumber = async (
    retryToken: string,
    failNumber: number,
    context: Context,
    dto?: string
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { failNumber };
    data[`fail${failNumber}`] = new Date().toJSON();
    data[`fail${failNumber}logGroup`] = context.logGroupName;
    data[`fail${failNumber}logStream`] = context.logStreamName;
    data[`fail${failNumber}request`] = context.awsRequestId;
    if (dto) data['dto'] = dto;
    const updateExpression = this.getUpdateExpression(data);

    await DocumentClient.update({
      TableName: this.DBretryTable,
      Key: {
        retryToken,
      },
      ...updateExpression,
    }).promise();
  };

  public genToken(request: unknown) {
    const str = JSON.stringify(request);
    return Buffer.from(str).toString('base64');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getUpdateExpression(update: any) {
    let prefix = 'set ';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateExpression: any = {
      UpdateExpression: '',
      ExpressionAttributeValues: {},
      ExpressionAttributeNames: {},
    };
    const attributes = Object.keys(update);
    for (let i = 0; i < attributes.length; i++) {
      const attribute = attributes[i];
      // if (attribute !== "id") {
      if (update[attribute] !== undefined) {
        updateExpression['UpdateExpression'] +=
          prefix + '#' + attribute + ' = :' + attribute;
        updateExpression['ExpressionAttributeValues'][':' + attribute] =
          update[attribute];
        updateExpression['ExpressionAttributeNames']['#' + attribute] = attribute;
        prefix = ', ';
      }
    }
    return updateExpression;
  }
}
