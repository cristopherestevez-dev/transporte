"use client";

import { useEffect, useMemo, useState } from "react";
import { Scale, Plus, RefreshCw, ChevronDown } from "lucide-react";
import Link from "next/link";
import api from "@/services/api";
import FacturaAdjunto from "@/app/components/ui/FacturaAdjunto/FacturaAdjunto";
import ComprobanteOperacion from "@/app/components/ui/ComprobanteOperacion/ComprobanteOperacion";
import BalanceCard from '@/app/components/ui/BalanceCard/BalanceCard';
import { amounts, summarize } from "@/lib/balance.mjs";

const types = { factura_a: "Factura A", factura_b: "Factura B", factura_c: "Factura C", factura_e: "Factura E", nota_credito: "Nota de crédito", nota_debito: "Nota de débito", recibo: "Recibo" };
const inputClass = "rounded-lg border border-divider bg-content1 text-foreground px-3 py-2";
const money = (cents) => (cents / 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Balance({ embedded = false, onManagePayments }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ from: "", to: "", company: "", scope: "", direction: "" });
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const load = async () => {
    setLoading(true); setError("");
    try {
      const groups = await Promise.all([
        api.getCobranzasNacionales(), api.getCobranzasInternacionales(),
        api.getPagosNacionales(), api.getPagosInternacionales(),
      ]);
      setRows(groups.flatMap((items, index) => items.map((item) => ({ ...item, direction: index < 2 ? "emitida" : "recibida", scope: index % 2 ? "internacionales" : "nacionales", endpoint: `${index < 2 ? "cobranzas" : "pagos"}/${index % 2 ? "internacionales" : "nacionales"}` }))));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => rows.filter((row) =>
    (!filters.from || row.fecha >= filters.from) && (!filters.to || row.fecha <= filters.to) &&
    (!filters.scope || row.scope === filters.scope) && (!filters.direction || row.direction === filters.direction) &&
    (!filters.company || `${row.razon_social} ${row.cuit} ${row.numero_comprobante}`.toLowerCase().includes(filters.company.toLowerCase()))
  ), [rows, filters]);
  const currencies = [...new Set(filtered.map((row) => row.moneda || "Sin definir"))].sort();
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await api.post(`/facturacion/${form.direction === "emitida" ? "cobranzas" : "pagos"}/${form.scope}`, { fecha: form.fecha, razon_social: form.razon_social, cuit: form.cuit, tipo_comprobante: form.tipo_comprobante, numero_comprobante: form.numero_comprobante, moneda: form.moneda, monto: Number(form.monto), plazo: Number(form.plazo) });
      setForm(null); await load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };
  const changeCurrency = async (row, moneda) => {
    if (!moneda) return;
    setSaving(true); setError("");
    try {
      const saved = await api.patch(`/facturacion/${row.endpoint}/${row._id}`, { moneda });
      setRows((previous) => previous.map((item) => item._id === row._id && item.endpoint === row.endpoint ? { ...item, ...saved } : item));
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };
  return <div className={`${embedded ? '' : 'p-6'} space-y-6 text-foreground`}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-3xl font-bold flex items-center gap-3"><Scale />Balance</h1>
      <div className="flex gap-3">
        <button disabled={loading || saving} onClick={load} className={inputClass}><RefreshCw size={18} /></button>
        <button onClick={() => setForm({ direction: "emitida", scope: "nacionales", fecha: "", razon_social: "", cuit: "", numero_comprobante: "", tipo_comprobante: "factura_a", moneda: "ARS", monto: "", plazo: 30 })} className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2"><Plus size={18} />Registrar comprobante</button>
      </div>
    </div>
    <p className="text-default-500">Facturación emitida contra recibida, con cobros, pagos y saldos pendientes. Los importes se comparan por moneda; las notas de crédito restan del total. Los recibos se muestran en el detalle, sin duplicar la facturación.</p>
    {error && <p role="alert" className="text-danger">{error}</p>}
    {form && <form onSubmit={save} className="bg-content1 border border-divider rounded-xl p-4 space-y-4">
      <h2 className="font-semibold">Registrar factura o comprobante</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="grid gap-1">Dirección<select className={inputClass} value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}><option value="emitida">Emitida — facturamos</option><option value="recibida">Recibida — nos facturan</option></select></label>
        <label className="grid gap-1">Ámbito<select className={inputClass} value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}><option value="nacionales">Nacional</option><option value="internacionales">Internacional</option></select></label>
        <label className="grid gap-1">Tipo<select className={inputClass} value={form.tipo_comprobante} onChange={(e) => setForm({ ...form, tipo_comprobante: e.target.value })}>{Object.entries(types).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        {[['Fecha', 'fecha', 'date'], ['Empresa / Fletero', 'razon_social', 'text'], ['CUIT', 'cuit', 'text'], ['Número', 'numero_comprobante', 'text'], ['Importe', 'monto', 'number'], ['Plazo de pago (días)', 'plazo', 'number']].map(([label, key, type]) => <label key={key} className="grid gap-1">{label}<input required type={type} min={key === 'monto' ? '0.01' : key === 'plazo' ? '0' : undefined} step={key === 'monto' ? '0.01' : undefined} className={inputClass} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>)}
        <label className="grid gap-1">Moneda<select className={inputClass} value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })}>{['ARS','USD','CLP'].map((value) => <option key={value}>{value}</option>)}</select></label>
      </div>
      <div className="flex gap-3"><button disabled={saving} className="bg-primary text-primary-foreground rounded-lg px-4 py-2">{saving ? 'Guardando…' : 'Guardar'}</button><button type="button" disabled={saving} onClick={() => setForm(null)} className={inputClass}>Cancelar</button></div>
    </form>}
    <div className="flex flex-wrap gap-3">
      <label className="grid gap-1">Desde<input className={inputClass} type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /></label>
      <label className="grid gap-1">Hasta<input className={inputClass} type="date" min={filters.from} value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></label>
      <label className="grid gap-1">Empresa, CUIT o factura<input className={inputClass} value={filters.company} onChange={(e) => setFilters({ ...filters, company: e.target.value })} /></label>
      <label className="grid gap-1">Ámbito<select className={inputClass} value={filters.scope} onChange={(e) => setFilters({ ...filters, scope: e.target.value })}><option value="">Todos</option><option value="nacionales">Nacionales</option><option value="internacionales">Internacionales</option></select></label>
      <label className="grid gap-1">Dirección<select className={inputClass} value={filters.direction} onChange={(e) => setFilters({ ...filters, direction: e.target.value })}><option value="">Ambas</option><option value="emitida">Emitida</option><option value="recibida">Recibida</option></select></label>
    </div>
    {loading ? <p>Cargando balance…</p> : !filtered.length ? <p>No hay comprobantes para los filtros seleccionados.</p> : currencies.map((currency) => {
      const entries = filtered.filter((row) => (row.moneda || 'Sin definir') === currency);
      const invoices = entries.filter((row) => row.tipo_comprobante !== 'recibo');
      const totals = summarize(invoices);
      const companies = [...new Set(invoices.map((row) => row.cuit || row.razon_social))];
      return <details key={currency} className="group bg-content1 rounded-xl border border-divider overflow-hidden">
        <summary className="flex flex-wrap items-center gap-3 p-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-content2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
          <h2 className="text-xl font-semibold">{currency}</h2>
          <span className="text-sm text-default-500">{entries.length} comprobante(s)</span>
          {currency !== 'Sin definir' && <span className="ml-auto text-sm text-default-500">Saldo pendiente neto <strong className={`ml-2 tabular-nums ${totals.pending < 0 ? 'text-danger' : 'text-primary'}`}>{money(totals.pending)}</strong></span>}
          <ChevronDown aria-hidden="true" size={20} className="ml-auto sm:ml-2 shrink-0 text-default-500 transition-transform group-open:rotate-180" />
        </summary>
        <div className="p-4 pt-0 space-y-4">
        {currency === 'Sin definir' && <p className="text-warning">Asigná la moneda en el detalle para incluir estos importes en su balance correspondiente.</p>}
        {currency !== 'Sin definir' && <BalanceCard rows={invoices} currency={currency} />}
        {currency !== 'Sin definir' && <div className="grid gap-3 sm:grid-cols-3">{[['Facturación emitida', totals.emitted], ['Facturación recibida', totals.received], ['Diferencia facturada', totals.balance], ['Cobrado', totals.collected], ['Pagado', totals.paid], ['Flujo neto', totals.cash], ['Por cobrar', totals.receivable], ['Por pagar', totals.payable], ['Saldo pendiente neto', totals.pending]].map(([label, value]) => <div key={label} className="bg-content2 rounded-lg p-3"><p className="text-sm text-default-500">{label}</p><p className="text-lg font-semibold tabular-nums">{money(value)}</p></div>)}</div>}
        {currency !== 'Sin definir' && <><h3 className="font-semibold">Detalle por empresa</h3>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b border-divider">{['Empresa / CUIT', 'Emitido', 'Recibido', 'Diferencia', 'Por cobrar', 'Por pagar'].map((label) => <th className="p-2" key={label}>{label}</th>)}</tr></thead><tbody>{companies.map((company) => { const items = invoices.filter((row) => (row.cuit || row.razon_social) === company); const summary = summarize(items); return <tr key={company} className="border-b border-divider"><td className="p-2">{items[0].razon_social}<br /><span className="text-default-500">{company}</span></td>{[summary.emitted, summary.received, summary.balance, summary.receivable, summary.payable].map((value, index) => <td key={index} className="p-2 tabular-nums">{money(value)}</td>)}</tr>; })}</tbody></table></div></>}
        <h3 className="font-semibold">Detalle de comprobantes ({entries.length})</h3>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b border-divider">{['Fecha', 'Vencimiento', 'Dirección', 'Ámbito', 'Empresa', 'Tipo', 'Número', 'Moneda', 'Estado', 'Importe', 'Cobrado / Pagado', 'Pendiente', 'Factura adjunta', 'Comprobante de cobro / pago'].map((label) => <th className="p-2 whitespace-nowrap" key={label}>{label}</th>)}</tr></thead><tbody>{entries.map((row) => { const value = amounts(row); return <tr key={`${row.endpoint}:${row._id}`} className="border-b border-divider hover:bg-content2"><td className="p-2 whitespace-nowrap">{row.fecha}</td><td className="p-2 whitespace-nowrap">{(() => { const date = new Date(`${row.fecha}T00:00:00`); if (Number.isNaN(date.getTime())) return "—"; date.setDate(date.getDate() + (row.plazo ?? 30)); const today = new Date(); today.setHours(0, 0, 0, 0); const expired = date < today && !["cobrado", "pagado"].includes(row.estado); return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${expired ? "bg-danger/10 text-danger" : "bg-content2 text-foreground"}`} title={expired ? "Vencido" : "Fecha de vencimiento"}>{date.toLocaleDateString("es-AR")}</span>; })()}</td><td className="p-2">{row.direction === 'emitida' ? 'Emitida' : 'Recibida'}</td><td className="p-2">{row.scope}</td><td className="p-2">{row.razon_social}</td><td className="p-2">{types[row.tipo_comprobante] || row.tipo_comprobante}</td><td className="p-2 whitespace-nowrap">{row.numero_comprobante}</td><td className="p-2"><select aria-label={`Moneda de ${row.numero_comprobante}`} disabled={saving} className={inputClass} value={row.moneda || ''} onChange={(e) => changeCurrency(row, e.target.value)}><option value="">Sin definir</option>{['ARS','USD','CLP'].map((item) => <option key={item}>{item}</option>)}</select></td><td className="p-2"><ComprobanteOperacion item={row} onChange={saved => setRows(previous => previous.map(item => item._id === row._id && item.endpoint === row.endpoint ? { ...item, ...saved } : item))} /></td>{[value.total, value.paid, value.pending].map((amount, index) => <td key={index} className="p-2 tabular-nums whitespace-nowrap">{money(amount)}</td>)}<td className="p-2"><FacturaAdjunto item={row} onChange={archivoFactura => setRows(previous => previous.map(item => item._id === row._id && item.endpoint === row.endpoint ? { ...item, archivoFactura } : item))} /></td><td className="p-2"><FacturaAdjunto tipo="comprobante" item={row} onChange={archivoPago => setRows(previous => previous.map(item => item._id === row._id && item.endpoint === row.endpoint ? { ...item, archivoPago } : item))} /></td></tr>; })}</tbody></table></div>
        </div>
      </details>;
    })}
    {onManagePayments ? <button type="button" onClick={onManagePayments} className="text-primary underline">Administrar cobros y pagos</button> : <Link href="/facturacion" className="text-primary underline">Administrar cobros y pagos</Link>}
  </div>;
}
