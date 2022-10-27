import { Description } from './Description';
import { DescriptionErrors } from './DescriptionErrors';

test('Creation', () => {
  const result = Description.create({ value: 'Well done transaction!' });

  expect(result.isSuccess).toBe(true);
  const description = result.value;
  expect(description.value).toBe('Well done transaction!');
});

test('Fails with null', () => {
  const result = Description.create({ value: null as unknown as string });

  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(DescriptionErrors.NotDefined);
});

test('Fails with type different from string', () => {
  const result = Description.create({ value: 1 as unknown as string });

  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(DescriptionErrors.NotString);
});

test('Fails with a short value', () => {
  const invalidData = {
    value: '12',
  };

  const result = Description.create(invalidData);
  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(DescriptionErrors.TooShort);
});

test('Fails with a long value', () => {
  const invalidData = {
    value: '',
  };
  Array(256)
    .fill(null)
    .map(() => {
      invalidData.value = invalidData.value.concat('x');
    });

  const result = Description.create(invalidData);
  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(DescriptionErrors.TooLong);
});

test('trimming', () => {
  const result = Description.create({ value: '    123    456   ' });

  expect(result.isSuccess).toBe(true);
  const description = result.value;
  expect(description.value).toBe('123 456');
});
