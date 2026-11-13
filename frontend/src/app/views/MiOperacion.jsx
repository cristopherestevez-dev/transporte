"use client";
import { idViaje } from "@/lib/idViaje";
import { useEffect, useState } from 'react';
import PlanillasChofer from "@/app/components/ui/PlanillasChofer";
import ColumnFilters from '@/app/components/ui/ColumnFilters';
import usePage from '@/hooks/usePage';
import Pagination, { PageSizeSelect } from '@/app/components/ui/Pagination/Pagination';
import TabsWrapper from "@/app/components/ui/TabsWrapper/TabsWrapper";

const currency = value => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value || 0);
const chileanCurrency = value => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value || 0);
function TripNumber({ number }) {
  return (
    <span aria-label={`Viaje ${number}`} className="inline-grid min-h-7 min-w-7 shrink-0 place-items-center rounded-full bg-primary/10 px-1.5 text-xs font-bold tabular-nums text-primary">
      {number}
    </span>
  );
}

function Table({ columns, rows, summary, offset }) {
  return <div className="table-frame"><table className="w-full text-sm text-foreground">
    <thead className="bg-content2"><tr>{columns.map(([key, label]) => <th key={key} className="p-3 text-left whitespace-nowrap">{label}</th>)}</tr></thead>
    <tbody>{rows.map((row, index) => (
      <tr key={row._id} className="border-t border-divider">
        {columns.map(([key, , render]) => (
          <td key={key} className="p-3">
            {key === 'origen' ? (
              <span className="inline-flex items-center gap-2">
                <TripNumber number={offset + index + 1} />
                {row.origen || '—'}
              </span>
            ) : render ? render(row[key], row) : row[key] || '—'}
          </td>
        ))}
      </tr>
    ))}
    {!rows.length && <tr><td colSpan={columns.length} className="p-6 text-default-500 text-center">Todavía no hay registros.</td></tr>}</tbody>
    {summary && <tfoot className="bg-content2 font-semibold"><tr>{columns.map(([key], index) => {
      if (index === 0) return <th key={key} scope="row" className="p-3 text-left">TOTAL</th>;
      const totals = { totalChofer: summary.totalChofer, viaticoArgentino: summary.viaticoArgentino, peajeAr: summary.peajeAr, viaticoChileno: summary.viaticoChileno, peajeCh: summary.peajeCh, adelantoAr: summary.adelantos, netoCobrar: summary.neto };
      const format = ['viaticoChileno', 'peajeCh'].includes(key) ? chileanCurrency : currency;
      return <td key={key} className="p-3 whitespace-nowrap">{key === 'netoCobrar' ? <div className={`rounded-[10px] px-4 py-3 ring-1 ${summary.neto < 0 ? 'bg-danger/10 text-danger ring-danger/20' : 'bg-primary/10 text-primary ring-primary/20'}`}><span className="block text-xs font-medium mb-1">Neto a cobrar · ARS</span><span className="text-xl md:text-2xl font-bold tabular-nums">{currency(summary.neto)}</span></div> : key in totals ? format(totals[key]) : ''}</td>;
    })}</tr></tfoot>}
  </table></div>;
}
function TripCards({ columns, rows, summary, offset }) {
  const details = columns.filter(([key]) => !['numeroOperativo', 'origen', 'destino', 'netoCobrar'].includes(key));

  return (
    <div className="space-y-3 md:hidden">
      <p className="rounded-[10px] bg-content2 p-3 text-sm">
        Neto de esta pestaña · ARS <strong className="block text-lg tabular-nums">{currency(summary.neto)}</strong>
      </p>
      {!rows.length && <p className="py-4 text-center text-sm text-default-500">Todavía no hay registros.</p>}
      {rows.map((row, index) => (
        <details key={row._id} className="rounded-[10px] border border-divider bg-content1">
          <summary className="min-h-11 cursor-pointer break-words p-3 text-sm font-semibold">
            <span className="inline-flex max-w-full items-center gap-2 align-middle">
              <TripNumber number={row.numeroOperativo ? idViaje(row.numeroOperativo, row.type) : offset + index + 1} />
              <span className="min-w-0">{row.origen || '—'} → {row.destino || '—'}</span>
            </span>
            <span className="mt-1 block font-normal">
              Neto a cobrar · {row.netoCobrar == null ? 'Pendiente de liquidar' : currency(row.netoCobrar)}
            </span>
          </summary>
          <dl className="grid grid-cols-2 gap-3 border-t border-divider p-3 text-sm">
            {details.map(([key, label, render]) => (
              <div key={key} className="min-w-0 break-words">
                <dt className="text-xs text-default-500">{label}</dt>
                <dd>{render ? render(row[key], row) || '—' : row[key] ?? '—'}</dd>
              </div>
            ))}
          </dl>
        </details>
      ))}
    </div>
  );
}

function DriverTrips({ page, filters, onFiltersChange }) {
  if (page.error) return <p role="alert" className="text-danger p-4">{page.error}</p>;
  if (!page.result) return <p className="p-4">Cargando…</p>;
  const { page: currentPage, pageSize } = page.result.pagination ?? page;
  const offset = (currentPage - 1) * pageSize;
  const tripColumns = [["numeroOperativo", "ID", (value, row) => idViaje(value, row.type)], ['origen', 'Origen'], ['destino', 'Destino'], ['fecha_salida', 'Salida'], ['fecha_llegada', 'Llegada'], ['carga', 'Carga'], ['camionPatente', 'Patente camión'], ['semirremolquePatente', 'Patente semi'], ['estado', 'Estado', value => value?.replaceAll('_', ' ')], ['totalChofer', 'Total chofer (ARS)', currency], ['viaticoArgentino', 'Viático (ARS)', currency], ['peajeAr', 'Peajes (ARS)', currency], ['viaticoChileno', 'Viático (CLP)'], ['peajeCh', 'Peajes (CLP)'], ['adelantoAr', 'Adelanto (ARS)', currency], ['netoCobrar', 'Neto a cobrar (ARS)', value => value == null ? 'Pendiente de liquidar' : currency(value)]];
  return <div><div className="mb-3 flex flex-wrap items-center justify-end gap-2">
    <PageSizeSelect {...page} className="" />
    <ColumnFilters fields={tripColumns.slice(1, 9).map(([key, label]) => ({
      key: 'col_' + key, label, type: key.startsWith('fecha_') ? 'date' : undefined,
      options: key === 'estado' ? [
        { value: 'pendiente', label: 'Pendiente' }, { value: 'en_transito', label: 'En tránsito' },
        { value: 'finalizado', label: 'Finalizado' }, { value: 'cancelado', label: 'Cancelado' },
      ] : undefined,
    }))} values={filters} onChange={onFiltersChange} />
  </div><div className="hidden md:block"><Table rows={page.result.data} columns={tripColumns} summary={page.result.summary} offset={offset} /></div><TripCards rows={page.result.data} columns={tripColumns} summary={page.result.summary} offset={offset} />{page.result.summary.pendientes > 0 && <p className="text-sm text-default-500 mt-3">{page.result.summary.pendientes} viaje(s) sin liquidación completa. Su importe todavía no está incluido en el neto.</p>}<Pagination {...page} /><p className="text-xs text-default-500">El neto incluye los descuentos y adelantos de la liquidación. Los totales abarcan todas las páginas.</p></div>;
}
export default function MiOperacion() {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    function actualizar() {
      if (document.visibilityState === "visible") setRevision(value => value + 1);
    }
    document.addEventListener("visibilitychange", actualizar);
    return () => document.removeEventListener("visibilitychange", actualizar);
  }, []);
  const [filtrosNacionales, setFiltrosNacionales] = useState({});
  const [filtrosInternacionales, setFiltrosInternacionales] = useState({});
  const nacionales = usePage('/mi-operacion/viajes', { tipo: 'nacional', ...filtrosNacionales }, revision);
  const internacionales = usePage('/mi-operacion/viajes', { tipo: 'internacional', ...filtrosInternacionales }, revision);
  const netoNacional = nacionales.result?.netoGeneral;
  const netoInternacional = internacionales.result?.netoGeneral;
  const error = nacionales.error || internacionales.error;

  return (
    <section className="space-y-4 p-3 md:space-y-5 md:p-6 bg-content1 rounded-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Mis viajes</h1>
        <div className="w-full rounded-[10px] bg-content2 px-4 py-3 sm:w-auto">
          <p className="text-sm font-medium">Total a cobrar · ARS</p>
          <p className="text-sm text-default-500">Nacionales + internacionales</p>
          <p className="mt-1 text-xl font-bold tabular-nums" aria-live="polite">
            {error
              ? 'No se pudo cargar el total'
              : netoNacional == null || netoInternacional == null
                ? 'Cargando…'
                : currency(netoNacional + netoInternacional)}
          </p>
        </div>
      </div>
      <TabsWrapper tabs={[
        { label: 'Nacionales', content: <DriverTrips page={nacionales} filters={filtrosNacionales} onFiltersChange={values => { nacionales.onPageChange(1); setFiltrosNacionales(values); }} /> },
        { label: 'Internacionales', content: <DriverTrips page={internacionales} filters={filtrosInternacionales} onFiltersChange={values => { internacionales.onPageChange(1); setFiltrosInternacionales(values); }} /> },
      ]} />
      <PlanillasChofer resumen revision={revision} />
    </section>
  );
}
