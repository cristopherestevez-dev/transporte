"use client";
import { Truck, Wrench } from "lucide-react";
import usePage from '@/hooks/usePage';
import Pagination, { PageSizeSelect } from '@/app/components/ui/Pagination/Pagination';
import TabsWrapper from "@/app/components/ui/TabsWrapper/TabsWrapper";

const currency = value => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value || 0);
const chileanCurrency = value => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value || 0);
function Table({ columns, rows, summary }) {
  return <div className="overflow-x-auto rounded-xl border border-divider"><table className="w-full text-sm text-foreground">
    <thead className="bg-content2"><tr>{columns.map(([key, label]) => <th key={key} className="p-3 text-left whitespace-nowrap">{label}</th>)}</tr></thead>
    <tbody>{rows.map(row => <tr key={row._id} className="border-t border-divider">{columns.map(([key, , render]) => <td key={key} className="p-3">{render ? render(row[key], row) : row[key] || "—"}</td>)}</tr>)}
    {!rows.length && <tr><td colSpan={columns.length} className="p-6 text-default-500 text-center">Todavía no hay registros.</td></tr>}</tbody>
    {summary && <tfoot className="bg-content2 font-semibold"><tr>{columns.map(([key], index) => {
      if (index === 0) return <th key={key} scope="row" className="p-3 text-left">TOTAL</th>;
      const totals = { totalChofer: summary.totalChofer, viaticoArgentino: summary.viaticoArgentino, peajeAr: summary.peajeAr, viaticoChileno: summary.viaticoChileno, peajeCh: summary.peajeCh, adelantoAr: summary.adelantos, netoCobrar: summary.neto };
      const format = ['viaticoChileno', 'peajeCh'].includes(key) ? chileanCurrency : currency;
      return <td key={key} className="p-3 whitespace-nowrap">{key === 'netoCobrar' ? <div className={`rounded-[10px] px-4 py-3 ring-1 ${summary.neto < 0 ? 'bg-danger/10 text-danger ring-danger/20' : 'bg-primary/10 text-primary ring-primary/20'}`}><span className="block text-xs font-medium mb-1">Neto a cobrar · ARS</span><span className="text-xl md:text-2xl font-bold tabular-nums">{currency(summary.neto)}</span></div> : key in totals ? format(totals[key]) : ''}</td>;
    })}</tr></tfoot>}
  </table></div>;
}
function DriverTrips({ tipo }) {
  const page = usePage('/mi-operacion/viajes', { tipo });
  if (page.error) return <p role="alert" className="text-danger p-4">{page.error}</p>;
  if (!page.result) return <p className="p-4">Cargando…</p>;
  const tripColumns = [['origen', 'Origen'], ['destino', 'Destino'], ['fecha_salida', 'Salida'], ['fecha_llegada', 'Llegada'], ['carga', 'Carga'], ['estado', 'Estado', value => value?.replaceAll('_', ' ')], ['totalChofer', 'Total chofer (ARS)', currency], ['viaticoArgentino', 'Viático (ARS)', currency], ['peajeAr', 'Peajes (ARS)', currency], ['viaticoChileno', 'Viático (CLP)'], ['peajeCh', 'Peajes (CLP)'], ['adelantoAr', 'Adelanto (ARS)', currency], ['netoCobrar', 'Neto a cobrar (ARS)', value => value == null ? 'Pendiente de liquidar' : currency(value)]];
  return <div><PageSizeSelect {...page} /><Table rows={page.result.data} columns={tripColumns} summary={page.result.summary} />{page.result.summary.pendientes > 0 && <p className="text-sm text-default-500 mt-3">{page.result.summary.pendientes} viaje(s) sin liquidación completa. Su importe todavía no está incluido en el neto.</p>}<Pagination {...page} /><p className="text-xs text-default-500">El neto incluye los descuentos y adelantos de la liquidación. Los totales abarcan todas las páginas.</p></div>;
}
function DriverTruck() {
  const page = usePage('/mi-operacion/camion');
  const data = page.result?.data;
  const error = page.error;
  if (error) return <p role="alert" className="p-6 text-danger">{error}</p>;
  if (!data) return <p className="p-6 text-default-500">Cargando…</p>;
  if (!data.camion) return <p className="p-6 text-default-500">Tu administrador todavía no te asignó un camión.</p>;
  const vehicle = data.camion;
  return <section className="space-y-6 p-6 bg-content1 rounded-xl">
    <h1 className="text-xl font-semibold flex items-center gap-2"><Truck size={22} />Mi camión</h1>
    <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">{[['patente', 'Patente'], ['marca', 'Marca'], ['modelo', 'Modelo'], ['anio', 'Año'], ['seguro', 'Seguro'], ['vencimiento_seguro', 'Vencimiento del seguro']].map(([key, label]) => <div key={key} className="p-4 bg-content2 rounded-[10px]"><dt className="text-xs text-default-500">{label}</dt><dd className="font-medium mt-1">{vehicle[key] || '—'}</dd></div>)}</dl>
    <h2 className="font-semibold flex items-center gap-2"><Wrench size={18} />Servicios y mantenimiento</h2>
    <PageSizeSelect {...page} />
    <Table rows={data.servicios} columns={[
      ['fecha', 'Fecha'], ['km', 'Kilómetros'], ['servicios', 'Trabajos realizados', (_, row) => Object.entries(row).filter(([key, value]) => key.endsWith('_cambio') && value === true).map(([key]) => key.replace('_cambio', '').replaceAll('_', ' ')).join(', ') || '—'], ['extras_descripcion', 'Observaciones'],
    ]} />
    <Pagination {...page} />
  </section>;
}
export default function MiOperacion({ camion = false }) {
  return camion ? <DriverTruck /> : <section className="space-y-5 p-6 bg-content1 rounded-xl"><h1 className="text-xl font-semibold">Mis viajes</h1><TabsWrapper tabs={['nacional', 'internacional'].map(tipo => ({ label: tipo === 'nacional' ? 'Nacionales' : 'Internacionales', content: <DriverTrips key={tipo} tipo={tipo} /> }))} /></section>;
}

