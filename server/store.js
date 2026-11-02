import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.resolve(here, '..', 'data');
const storePath = path.join(dataDirectory, 'store.json');

const productSeeds = [
  { id: 'p-earbuds', name: 'Wireless Earbuds', sku: 'AUD-1042', marketplace: 'Amazon', category: 'Electronics', price: 49.99, cogs: 16.4, stock: 84, minStock: 30, color: '#dce8f8' },
  { id: 'p-case', name: 'Everyday Phone Case', sku: 'ACC-2081', marketplace: 'Shopify', category: 'Accessories', price: 24.5, cogs: 6.2, stock: 18, minStock: 24, color: '#f5e4d8' },
  { id: 'p-lamp', name: 'LED Desk Lamp', sku: 'HOM-3107', marketplace: 'Amazon', category: 'Home & Living', price: 38, cogs: 13.8, stock: 56, minStock: 20, color: '#e8e2f5' },
  { id: 'p-pack', name: 'Metro Daypack', sku: 'BAG-4014', marketplace: 'Etsy', category: 'Accessories', price: 68, cogs: 27, stock: 9, minStock: 12, color: '#dfeade' },
  { id: 'p-bottle', name: 'Insulated Bottle', sku: 'OUT-5026', marketplace: 'Shopify', category: 'Outdoor', price: 32, cogs: 10.5, stock: 142, minStock: 35, color: '#f4e7cc' },
];

function createSeedState() {
  const orders = [];
  const dailyCounts = [4, 3, 5, 6, 4, 8, 7, 5, 9, 6, 8, 10, 7, 11, 9, 8, 12, 10, 8, 13, 11, 12, 10, 14, 11, 13, 12, 15, 13, 14];
  const products = productSeeds.map((item) => ({ ...item, createdAt: new Date().toISOString() }));
  let orderNumber = 1;
  for (let day = 89; day >= 0; day -= 1) {
    const baseCount = dailyCounts[(89 - day) % dailyCounts.length];
    const count = Math.max(2, Math.round(baseCount * (day > 59 ? 0.68 : day > 29 ? 0.86 : 1)));
    for (let index = 0; index < count; index += 1) {
      const product = products[(day * 2 + index * 3 + Math.floor(index / 2)) % products.length];
      const date = new Date();
      date.setDate(date.getDate() - day);
      date.setHours(9 + ((index * 2) % 10), (index * 13) % 60, 0, 0);
      const quantity = index % 8 === 0 ? 2 : 1;
      const price = product.price;
      const returned = index % 31 === 4;
      orders.push({
        id: `ord-${String(orderNumber).padStart(4, '0')}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        marketplace: product.marketplace,
        quantity,
        unitPrice: price,
        unitCost: product.cogs,
        marketplaceFee: Number((price * quantity * 0.12).toFixed(2)),
        shipping: Number((quantity * (product.marketplace === 'Etsy' ? 5.8 : 3.2)).toFixed(2)),
        advertising: Number((price * quantity * (index % 4 === 0 ? 0.08 : 0.035)).toFixed(2)),
        otherExpense: Number((quantity * 0.45).toFixed(2)),
        refundAmount: returned ? price : 0,
        status: returned ? 'Returned' : (index % 9 === 0 ? 'Processing' : 'Delivered'),
        date: date.toISOString(),
      });
      orderNumber += 1;
    }
  }

  const returns = orders.filter((order) => order.status === 'Returned').map((order, index) => ({
    id: `ret-${String(index + 1).padStart(3, '0')}`,
    orderId: order.id,
    productId: order.productId,
    productName: order.productName,
    marketplace: order.marketplace,
    amount: order.refundAmount,
    reason: ['Changed my mind', 'Item not as expected', 'Arrived late'][index % 3],
    date: order.date,
    status: 'Refunded',
  }));

  return {
    demoMode: true,
    business: { name: 'Northstar Goods', currency: 'USD', timezone: 'America/New_York' },
    products,
    orders,
    returns,
    expenses: { monthlySubscriptions: 84, monthlyOther: 125 },
    connections: [
      { marketplace: 'Amazon', status: 'Demo data', lastSync: null },
      { marketplace: 'Shopify', status: 'Demo data', lastSync: null },
      { marketplace: 'Etsy', status: 'Demo data', lastSync: null },
    ],
  };
}

export function loadStore() {
  mkdirSync(dataDirectory, { recursive: true });
  if (!existsSync(storePath)) {
    const initial = createSeedState();
    writeFileSync(storePath, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    return JSON.parse(readFileSync(storePath, 'utf8'));
  } catch (error) {
    throw new Error(`Could not read the data store at ${storePath}: ${error.message}`);
  }
}

export function saveStore(state) {
  mkdirSync(dataDirectory, { recursive: true });
  writeFileSync(storePath, JSON.stringify(state, null, 2), 'utf8');
}

export function resetStore() {
  const state = createSeedState();
  saveStore(state);
  return state;
}
