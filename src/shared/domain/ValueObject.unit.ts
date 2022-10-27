import { ValueObject } from './ValueObject';

interface SampleProps {
  name: string;
}
export class Sample extends ValueObject<SampleProps> {
  private readonly name: string;
  public constructor(props: SampleProps) {
    super(props);
    this.name = props.name;
  }
  get value(): string {
    return this.name;
  }
}

export class Sample2 extends Sample {
  public constructor(props: SampleProps) {
    super(props);
  }
}

describe('ValueObject equality by structure', () => {
  it(`should be equal for same class and data`, () => {
    const sample1 = new Sample({ name: '1' });
    const sample2 = new Sample({ name: '1' });
    expect(sample1.equals(sample2)).toBe(true);
  });

  it(`shouldn't be equal for same class and different data`, () => {
    const sample1 = new Sample({ name: '1' });
    const sample2 = new Sample({ name: '2' });
    expect(sample1.equals(sample2)).toBe(false);
  });

  it(`shouldn't be equal for different class and same data`, () => {
    const sample1 = new Sample({ name: '1' });
    const sample2 = new Sample2({ name: '1' });
    expect(sample1.equals(sample2)).toBe(false);
  });
});
