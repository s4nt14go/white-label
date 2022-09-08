import { UniqueEntityID } from './UniqueEntityID';

const isEntity = (v: unknown): v is Entity<unknown> => {
  return v instanceof Entity;
};

export abstract class Entity<T> {
  protected readonly _id: UniqueEntityID;
  public readonly props: T;
  private __proto__: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  constructor(props: T, id?: UniqueEntityID) {
    this._id = id ? id : new UniqueEntityID();
    this.props = props;
  }

  public equals(object?: Entity<T>): boolean {
    if (object == null) {
      return false;
    }
    if (this === object) {
      return true;
    }
    if (!isEntity(object)) {
      return false;
    }
    if (this.__proto__.constructor.name !== object.constructor.name) return false;

    return this._id.equals(object._id);
  }
}
