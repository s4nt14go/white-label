import { Entity } from '../../../shared/domain/Entity';
import { UniqueEntityID } from '../../../shared/domain/UniqueEntityID';

export class UserId extends Entity<unknown> {
  get id(): UniqueEntityID {
    return this._id;
  }
}
