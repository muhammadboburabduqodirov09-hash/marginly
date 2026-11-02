import crypto from 'node:crypto';
import { z } from 'zod';
import { orderFinancials } from './calculations.js';
export const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
export function financials(order) { return orderFinancials(order); }
export function aggregate(orders) {
  const t = { revenue: 0, productCost: 0, marketplaceFees: 0, shipping: 0, storage: 0, advertising: 0, other: 0, refunds: 0, profit: 0, units: 0 };
  for (const o of orders) { if (o.status === 'Cancelled') continue; const f = financials(o); t.revenue += f.revenue; t.productCost += f.productCost; t.marketplaceFees += f.marketplaceFees; t.shipping += f.shipping; t.storage += Number(o.storageFee || 0); t.advertising += f.advertising; t.other += f.other; t.refunds += f.refunds; t.profit += f.netProfit; t.units += o.quantity; }
  return { ...Object.fromEntries(Object.entries(t).map(([k,v]) => [k,round(v)])), margin: t.revenue ? round(100*t.profit/t.revenue) : 0, roi: t.productCost ? round(100*t.profit/t.productCost) : 0 };
}
export function predictBaseline(orders, product, now = new Date()) {
  const daily = Array(30).fill(0); const midnight = Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());
  for (const o of orders) { if (String(o.productId) !== String(product._id) || o.status === 'Returned' || o.status === 'Cancelled') continue; const day = Math.floor((midnight - Date.UTC(new Date(o.date).getUTCFullYear(),new Date(o.date).getUTCMonth(),new Date(o.date).getUTCDate()))/86400000); if (day >= 0 && day < 30) daily[29-day] += o.quantity; }
  const velocity = daily.reduce((a,b)=>a+b,0)/30; const recent = daily.slice(-7).reduce((a,b)=>a+b,0)/7; const previous = daily.slice(-14,-7).reduce((a,b)=>a+b,0)/7;
  const trend = recent > previous * 1.15 ? 'accelerating' : recent < previous * .85 ? 'declining' : 'steady';
  const adjustedVelocity = velocity ? Math.max(.1, velocity*.5+recent*.5) : 0;
  const daysRemaining = adjustedVelocity ? round(product.stock/adjustedVelocity) : null;
  const lead = product.leadTimeDays || 7;
  return { daily, velocity: round(velocity), trend, daysRemaining, reorderQuantity: Math.max(0,Math.ceil(adjustedVelocity*(lead+14)-product.stock)), reorderDate: daysRemaining === null ? null : new Date(now.getTime()+Math.max(0,Math.floor(daysRemaining-lead))*86400000).toISOString().slice(0,10), leadTimeDays: lead, stock: product.stock };
}
export async function deepseek(system, payload, maxTokens = 230) {
  if (!process.env.DEEPSEEK_API_KEY) return null;
  const base = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/,'');
  const response = await fetch(`${base}/chat/completions`, { method:'POST', signal: AbortSignal.timeout(16000), headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`, 'Content-Type':'application/json' }, body: JSON.stringify({ model: process.env.DEEPSEEK_MODEL || 'deepseek-chat', max_tokens:maxTokens, temperature:0.1, response_format:{type:'json_object'}, messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(payload)}] }) });
  if (!response.ok) throw new Error(`AI provider failed (${response.status})`);
  const raw=(await response.json()).choices?.[0]?.message?.content;
  if (!raw?.trim()) throw new Error('Empty AI response');
  return JSON.parse(raw);
}
export function seal(value) { const key = Buffer.from(process.env.CREDENTIAL_ENCRYPTION_KEY || '', 'hex'); if (key.length!==32) throw new Error('CREDENTIAL_ENCRYPTION_KEY must be 64 hex characters'); const iv=crypto.randomBytes(12); const cipher=crypto.createCipheriv('aes-256-gcm',key,iv); const payload=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]); return Buffer.concat([iv,cipher.getAuthTag(),payload]).toString('base64'); }
export const sha256 = s=>crypto.createHash('sha256').update(s).digest('hex');
export const accountSchema=z.object({email:z.string().email().max(200),password:z.string().min(10).max(128)});
