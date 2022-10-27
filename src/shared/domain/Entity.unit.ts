import { Entity } from './Entity';
import { EntityID } from './EntityID';

interface SampleProps {
  name: string;
}
export class Sample extends Entity<SampleProps> {
  private readonly name: string;
  public constructor(props: SampleProps, id?: EntityID) {
    super(props, id);
    this.name = props.name;
  }
  get value(): string {
    return this.name;
  }
}

export class Sample2 extends Sample {
  public constructor(props: SampleProps, id?: EntityID) {
    super(props, id);
  }
}

describe('Entity equality by identifier', () => {
  it(`shouldn't be equal for brand new entities with same data`, () => {
    const sample1 = new Sample({ name: '1' });
    const sample2 = new Sample({ name: '1' });
    expect(sample1.equals(sample2)).toBe(false);
  });

  it(`should be equal for same class and id, even with different data`, () => {
    const sample1 = new Sample({ name: '1' }, new EntityID('id'));
    const sample2 = new Sample({ name: '2' }, new EntityID('id'));
    expect(sample1.equals(sample2)).toBe(true);
  });

  it(`shouldn't be equal for same id and different class`, () => {
    const sample1 = new Sample({ name: '1' }, new EntityID('id'));
    const sample2 = new Sample2({ name: '1' }, new EntityID('id'));
    expect(sample1.equals(sample2)).toBe(false);
  });
});
