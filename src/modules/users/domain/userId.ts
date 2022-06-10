import { Entity } from '../../../core/domain/Entity';
import { UniqueEntityID } from '../../../core/domain/UniqueEntityID';

export class UserId extends Entity<unknown> {
  get id(): UniqueEntityID {
    return this._id;
  }
}
