import { shallowEqual } from 'shallow-equal-object';

interface ValueObjectProps {
  [index: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * @desc ValueObjects are objects that we determine their
 * equality through their structrual property.
 */

export abstract class ValueObject<T extends ValueObjectProps> {
  public readonly props: T;
  private __proto__: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  protected constructor(props: T) {
    this.props = Object.freeze(props);
  }

  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    if (vo.props === undefined) {
      return false;
    }
    if (this.__proto__.constructor.name !== vo.constructor.name) return false;
    return shallowEqual(this.props, vo.props);
  }
}
