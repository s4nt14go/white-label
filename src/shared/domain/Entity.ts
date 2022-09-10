import { EntityID } from './EntityID';

const isEntity = (v: unknown): v is Entity<unknown> => {
  return v instanceof Entity;
};

export abstract class Entity<T> {
  protected readonly _id: EntityID;
  public readonly props: T;
  private __proto__: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  protected constructor(props: T, id?: EntityID) {
    this._id = id ? id : new EntityID();
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
