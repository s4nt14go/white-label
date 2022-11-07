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
    value: Amount.MAX_ABS + 1,
  };

  const result = Amount.create(data);

  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(AmountErrors.MaxBreached);
});
test('Creation fails with a value less than min', () => {
  const data = {
    value: -Amount.MAX_ABS - 1,
  };

  const result = Amount.create(data);

  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(AmountErrors.MaxBreached);
});

test('36326231234624.984 rounds to 36326231234624.98', () => {
  const value = Amount.create({ value: 36326231234624.984 }).value.value;

  expect(value.toString()).toBe('36326231234624.98');
});

test('1.93 + 10.21 = 12.14', () => {
  const v1 = Amount.create({ value: 1.93 }).value;
  const v2 = Amount.create({ value: 10.21 }).value;

  const r = v1.add(v2).value.value;

  expect(r).toBe(12.14);
});

test('-3.77 - 10.98 = -14.75', () => {
  const v1 = Amount.create({ value: -3.77 }).value;
  const v2 = Amount.create({ value: 10.98 }).value;

  const r = v1.subtract(v2).value.value;

  expect(r).toBe(-14.75);
});

test('0 - -10.98 = 10.98', () => {
  const v1 = Amount.create({ value: 0 }).value;
  const v2 = Amount.create({ value: -10.98 }).value;

  const r = v1.subtract(v2).value.value;

  expect(r).toBe(10.98);
});

test('82102892877577.4 - 42297692960849.49 = 39805199916727.91', () => {
  const v1 = Amount.create({ value: 82102892877577.4 }).value;
  const v2 = Amount.create({ value: 42297692960849.49 }).value;

  const r = v1.subtract(v2).value.value;

  expect(r).toBe(39805199916727.91);
});