import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateProductProfit, daysUntilStockout, calculateReturnRate, isWithinDateRange } from './calculations.js';

test('calculates revenue, gross profit, expenses, net profit, and margin', () => {
  const result = calculateProductProfit({ price: 20, cogs: 5 }, 3, {
    marketplaceFees: 3, shipping: 2, advertising: 1, other: 1, refunds: 0,
  });
  assert.equal(result.revenue, 60);
  assert.equal(result.grossProfit, 45);
  assert.equal(result.totalExpenses, 22);
  assert.equal(result.netProfit, 38);
  assert.equal(result.profitMargin, (38 / 60) * 100);
});

test('handles zero revenue and zero inventory velocity safely', () => {
  assert.equal(calculateProductProfit({ price: 0, cogs: 5 }, 0).profitMargin, 0);
  assert.deepEqual(daysUntilStockout(12, 0, 30), { averageDailySales: 0, daysRemaining: null });
});

test('calculates inventory runway and return rate', () => {
  assert.deepEqual(daysUntilStockout(20, 10, 5), { averageDailySales: 2, daysRemaining: 10 });
  assert.equal(calculateReturnRate(2, 20), 10);
  assert.equal(calculateReturnRate(0, 0), 0);
});

test('filters timestamps inclusively by date range', () => {
  assert.equal(isWithinDateRange('2025-01-02T12:00:00Z', '2025-01-02T00:00:00Z', '2025-01-02T23:59:59Z'), true);
  assert.equal(isWithinDateRange('2025-01-03T00:00:00Z', '2025-01-01T00:00:00Z', '2025-01-02T23:59:59Z'), false);
});
