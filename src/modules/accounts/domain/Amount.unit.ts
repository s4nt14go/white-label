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
    value: '1' as never,
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

test('round up 0.015', () => {
  const result = Amount.create({ value: 0.015 });

  expect(result.isSuccess).toBe(true);
  const amount = result.value;
  expect(amount.value).toBe(0.02);
});

test('round up 10.075', () => {
  const result = Amount.create({ value: 10.075 });

  expect(result.isSuccess).toBe(true);
  const amount = result.value;
  expect(amount.value).toBe(10.08);
});

test('round up -10.995', () => {
  const result = Amount.create({ value: -10.995 });

  expect(result.isSuccess).toBe(true);
  const amount = result.value;
  expect(amount.value).toBe(-11);
});

test('Creation fails with a value greater than max', () => {
  const data = {
    value: Number.MAX_SAFE_INTEGER,
  };

  const result = Amount.create(data);

  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(AmountErrors.MaxBreached);
});
test('Creation fails with a value less than min', () => {
  const data = {
    value: -Number.MAX_SAFE_INTEGER,
  };

  const result = Amount.create(data);

  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(AmountErrors.MaxBreached);
});

test('36326231234624.984 rounds to 36326231234624.98', () => {
  const value = Amount.create({ value: 36326231234624.984}).value.value;

  expect(value.toString()).toBe('36326231234624.98');
})
