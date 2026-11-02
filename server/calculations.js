export function calculateProductProfit(product, unitsSold, expenses = {}) {
  const revenue = Number(product.price) * unitsSold;
  const productCost = Number(product.cogs) * unitsSold;
  const marketplaceFees = Number(expenses.marketplaceFees ?? 0);
  const shipping = Number(expenses.shipping ?? 0);
  const advertising = Number(expenses.advertising ?? 0);
  const other = Number(expenses.other ?? 0);
  const storage = Number(expenses.storage ?? 0);
  const refunds = Number(expenses.refunds ?? 0);
  const grossProfit = revenue - productCost;
  const totalExpenses = productCost + marketplaceFees + shipping + advertising + other + storage + refunds;
  const netProfit = revenue - totalExpenses;

  return {
    revenue,
    productCost,
    grossProfit,
    marketplaceFees,
    shipping,
    advertising,
    other,
    storage,
    refunds,
    totalExpenses,
    netProfit,
    profitMargin: revenue === 0 ? 0 : (netProfit / revenue) * 100,
  };
}

export function daysUntilStockout(stock, unitsSold, periodDays) {
  const averageDailySales = periodDays > 0 ? unitsSold / periodDays : 0;
  return {
    averageDailySales,
    daysRemaining: averageDailySales === 0 ? null : stock / averageDailySales,
  };
}

export function calculateReturnRate(returnedOrders, totalOrders) {
  return totalOrders === 0 ? 0 : (returnedOrders / totalOrders) * 100;
}

export function isWithinDateRange(date, start, end) {
  const value = new Date(date).getTime();
  return value >= new Date(start).getTime() && value <= new Date(end).getTime();
}

export function orderFinancials(order) {
  const revenue = order.unitPrice * order.quantity;
  const productCost = order.unitCost * order.quantity;
  const expenses = {
    marketplaceFees: order.marketplaceFee,
    shipping: order.shipping,
    advertising: order.advertising,
    other: order.otherExpense,
    storage: order.storageFee ?? 0,
    refunds: order.refundAmount ?? 0,
  };
  const totals = calculateProductProfit({ price: order.unitPrice, cogs: order.unitCost }, order.quantity, expenses);
  return { ...totals, revenue, productCost };
}
