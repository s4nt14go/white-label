import '../../../../../environment';
import { IUserRepo } from '../userRepo';
import { UserEmail } from '../../domain/userEmail';
import { User } from '../../domain/user';
import { DomainEvents } from '../../../../core/domain/events/DomainEvents';
import DynamoDB = require('aws-sdk/clients/dynamodb');
import { UserMap } from '../../mappers/UserMap';

const { UsersTable: TableName } = process.env;
const DocumentClient = new DynamoDB.DocumentClient();

export class UserRepoDynamo implements IUserRepo {
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
    await DocumentClient.put({
      TableName,
      Item,
    }).promise();
    await DomainEvents.dispatchEventsForAggregate(user.id); // NOTE: Dispatch the events after the aggregate changes we're interested to emit (i.e. create, update, delete), are done in the real/faked repository.
  }
}
