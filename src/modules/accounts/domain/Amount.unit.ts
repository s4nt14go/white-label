import { Amount } from './Amount';
import { AmountErrors } from './AmountErrors';

test('Creation', () => {
  const validData = {
    value: 100,
  };

  const result = Amount.create(validData);
  expect(result.isSuccess).toBe(true);
  const amount = result.value;
  expect(amount.value).toBe(100);
});

test('Fails with null', () => {
  const result = Amount.create({ value: null as unknown as number });

  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(AmountErrors.NotDefined);
});

test('Creation fails with a non-number value', () => {
  const invalidData = {
    value: '1' as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  };

  const result = Amount.create(invalidData);

  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(AmountErrors.NotNumber);
});

test('round down', () => {
  const result = Amount.create({ value: 0.01499 });

  expect(result.isSuccess).toBe(true);
  const amount = result.value;
  expect(amount.value).toBe(0.01);
});

test('round up', () => {
  const result = Amount.create({ value: 0.015 });

  expect(result.isSuccess).toBe(true);
  const amount = result.value;
  expect(amount.value).toBe(0.02);
});

test('Creation fails with a value greater than max', () => {
  const data = {
    value: Number.MAX_SAFE_INTEGER / 100 + 1,
  };

  const result = Amount.create(data);

  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(AmountErrors.MaxBreached);
});
test('Creation fails with a value less than min', () => {
  const data = {
    value: -Number.MAX_SAFE_INTEGER / 100 - 1,
  };

  const result = Amount.create(data);

  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(AmountErrors.MaxBreached);
});
