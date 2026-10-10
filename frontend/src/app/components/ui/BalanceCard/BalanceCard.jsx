"use client";
import { TrendingDown, TrendingUp } from 'lucide-react';
import { amounts, summarize } from '@/lib/balance.mjs';

const money = cents => (cents / 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function Bars({ title, currency, values }) {
  const maximum = Math.max(1, ...values.map(item => Math.abs(item.value)));
  return <section className="p-4 rounded-xl border border-divider bg-content2/50"><h3 className="font-semibold mb-4">{title} · {currency}</h3><div className="space-y-4">{values.map(({ label, value, color }) => <div key={label}><div className="flex justify-between gap-3 text-sm mb-2"><span className="text-default-500">{label}</span><span className={`tabular-nums font-semibold ${value < 0 ? 'text-danger' : ''}`}>{money(value)}</span></div><div role="img" aria-label={`${label}: ${money(value)} ${currency}`} className="h-3 rounded-full bg-content2 overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.abs(value) / maximum * 100}%` }} /></div></div>)}</div></section>;
}
export default function BalanceCard({ rows = [], currency }) {
  const totals = summarize(rows);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const overdue = rows.reduce((result, row) => {
    const date = new Date(`${row.fecha}T00:00:00`); date.setDate(date.getDate() + (row.plazo ?? 30));
    if (row.estado === 'vencido' || date < today) result[row.direction === 'emitida' ? 'receivable' : 'payable'] += amounts(row).pending;
    return result;
  }, { receivable: 0, payable: 0 });
  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3">{[['Flujo neto', totals.cash, 'Cobrado − pagado'], ['Por cobrar', totals.receivable, 'Saldo de facturas emitidas'], ['Por pagar', totals.payable, 'Saldo de facturas recibidas']].map(([label, value, description]) => <section key={label} className="bg-content2 rounded-xl p-4"><p className="flex items-center gap-2 text-sm text-default-500">{value < 0 ? <TrendingDown size={18} /> : <TrendingUp size={18} />}{label}</p><p className={`text-2xl font-bold tabular-nums mt-2 ${value < 0 ? 'text-danger' : 'text-primary'}`}>{money(value)}</p><p className="text-xs text-default-500 mt-1">{description} · {currency}</p></section>)}</div>
    <div className="grid gap-4 lg:grid-cols-2"><Bars title="Facturación" currency={currency} values={[{ label: 'Emitida', value: totals.emitted, color: 'bg-primary' }, { label: 'Recibida', value: totals.received, color: 'bg-secondary' }]} /><Bars title="Cobros y pagos" currency={currency} values={[{ label: 'Cobrado', value: totals.collected, color: 'bg-success' }, { label: 'Pagado', value: totals.paid, color: 'bg-warning' }]} /><Bars title="Cobranzas pendientes" currency={currency} values={[{ label: 'Dentro de plazo', value: totals.receivable - overdue.receivable, color: 'bg-primary' }, { label: 'Vencidas', value: overdue.receivable, color: 'bg-danger' }]} /><Bars title="Pagos pendientes" currency={currency} values={[{ label: 'Dentro de plazo', value: totals.payable - overdue.payable, color: 'bg-warning' }, { label: 'Vencidos', value: overdue.payable, color: 'bg-danger' }]} /></div>
  </div>;
}
