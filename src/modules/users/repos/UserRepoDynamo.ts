import '../../../../environment';
import { IUserRepo } from './IUserRepo';
import { UserEmail } from '../domain/userEmail';
import { User } from '../domain/user';
import DynamoDB = require('aws-sdk/clients/dynamodb');
import { UserMap } from '../mappers/UserMap';
import { UnitOfWorkDynamo } from '../../../core/infra/unitOfWork/UnitOfWorkDynamo';

const { UsersTable: TableName } = process.env;
const DocumentClient = new DynamoDB.DocumentClient();

export class UserRepoDynamo implements IUserRepo {
  private unitOfWork: UnitOfWorkDynamo;

  constructor(unitOfWork: UnitOfWorkDynamo) {
    this.unitOfWork = unitOfWork;
  }

  async findUserByUsername(username: string): Promise<User | null> {
    const { Items } = await DocumentClient.query({
      TableName,
      IndexName: 'byUsername',
      KeyConditionExpression: '#name1 = :value1',
      ExpressionAttributeValues: {
        ':value1': username,
      },
      ExpressionAttributeNames: {
        '#name1': 'username',
      },
    }).promise();

    if (!Items || !Items.length) return null;

    return UserMap.toDomain(Items[0]);
  }

  async exists(email: UserEmail): Promise<boolean> {
    const { Items } = await DocumentClient.query({
      TableName,
      IndexName: 'byEmail',
      KeyConditionExpression: '#name1 = :value1',
      ExpressionAttributeValues: {
        ':value1': email.value,
      },
      ExpressionAttributeNames: {
        '#name1': 'email',
      },
    }).promise();

    return !Items || !Items.length ? false : true;
  }

  async save(user: User) {
    const Item = await UserMap.toPersistence(user);
    this.unitOfWork.addTransaction({
      Put: {
        TableName,
        Item,
      },
    });
  }
}
