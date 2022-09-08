export class Identifier<T> {
  public constructor(private value: T) {
    this.value = value;
  }

  public equals(id?: Identifier<T>): boolean {
    if (id === null || id === undefined) {
      return false;
    }
    if (!(id instanceof this.constructor)) {
      return false;
    }
    return id.toValue() === this.value;
  }

  public toString() {
    return String(this.value);
  }

  /**
   * Return raw value of identifier
   */

  public toValue(): T {
    return this.value;
  }
}
