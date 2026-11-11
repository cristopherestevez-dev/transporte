"use client";

import Button from "@/app/components/ui/Button/button";
import { useEffect, useRef, useState } from "react";
import api from "@/services/api";
import { tripMargin } from "@/lib/trip-margin.mjs";

function money(cents, currency) {
  return (cents / 100).toLocaleString("es-AR", { style: "currency", currency, currencyDisplay: "code", maximumFractionDigits: 2 });
}

export default function ViajeCombustible({ trip, scope, canRegister, onSaved }) {
  const [trucks, setTrucks] = useState(null);
  const [truckError, setTruckError] = useState("");
  const [reload, setReload] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const request = useRef(null);
  const pending = useRef(false);
  const rows = tripMargin(trip);

  useEffect(() => {
    if (!canRegister) return;
    let active = true;
    api.get("/viajes/combustible/camiones")
      .then((data) => { if (active) setTrucks(data); })
      .catch(() => { if (active) setTruckError("No se pudieron cargar los camiones."); });
    return () => { active = false; };
  }, [canRegister, reload]);

  async function saveFuel(event) {
    event.preventDefault();
    if (pending.current) return;
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const data = { ...values, importe: Number(values.importe) };
    const key = JSON.stringify(data);
    if (request.current?.key !== key) request.current = { key, id: crypto.randomUUID() };

    pending.current = true;
    setSaving(true);
    setError("");
    try {
      const resource = scope === "internacional" ? "internacionales" : "nacionales";
      const saved = await api.post("/viajes/" + resource + "/" + trip._id + "/combustible", {
        ...data, registroId: request.current.id,
      });
      onSaved(saved);
      form.reset();
      request.current = null;
    } catch (err) {
      setError(err.message);
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  const field = "mt-1 block w-full rounded-md border border-divider bg-content2 p-2 text-foreground";

  return (
    <section className="space-y-5 rounded-xl border border-divider bg-content1 p-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Margen con costos registrados</h2>
        {rows.length === 0 && <p className="text-sm">Sin ingresos ni costos registrados.</p>}
        <div className="grid gap-3 sm:grid-cols-3">
          {rows.map(({ currency, income, costs, cost, margin }) => (
            <div key={currency} className="rounded-lg bg-content2 p-3">
              <h3 className="font-semibold">{currency}</h3>
              <dl className="space-y-1 text-sm">
                <div><dt className="inline">Ingreso acordado </dt><dd className="inline">{income === null ? "Sin registrar" : money(income, currency)}</dd></div>
                {costs.map(({ label, cents }) => (
                  <div key={label}><dt className="inline">{label} </dt><dd className="inline">{money(cents, currency)}</dd></div>
                ))}
                <div><dt className="inline">Costos registrados </dt><dd className="inline">{money(cost, currency)}</dd></div>
                <div className="border-t border-divider pt-1 font-semibold">
                  <dt className="inline">Margen </dt>
                  <dd className="inline">{margin === null ? "Sin ingreso en esta moneda" : money(margin, currency)}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Cargas de combustible</h2>
        {trip.cargasCombustible?.length ? (
          <ul className="divide-y divide-divider text-sm">
            {trip.cargasCombustible.map((carga) => (
              <li key={carga.registroId} className="flex flex-wrap justify-between gap-x-4 py-2">
                <span>{carga.patente} · <time dateTime={carga.fecha}>{carga.fecha}</time></span>
                <span>{money(Math.round(carga.importe * 100), carga.moneda)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm">Sin cargas registradas para este viaje.</p>}
        {canRegister && truckError && (
          <p role="alert" className="text-sm">
            {truckError}{" "}
            <Button native type="button" className="text-primary underline" onClick={() => {
              setTruckError("");
              setReload((value) => value + 1);
            }}>Reintentar</Button>
          </p>
        )}
        {canRegister && !trucks && !truckError && <p className="text-sm">Cargando camiones…</p>}
        {canRegister && trucks?.length === 0 && <p className="text-sm">No hay camiones registrados.</p>}
        {canRegister && Boolean(trucks?.length) && (
          <form onSubmit={saveFuel} className="space-y-3">
            <fieldset disabled={saving} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-sm">Camión
                <select name="camionId" required className={field} defaultValue="">
                  <option value="" disabled>Seleccionar patente</option>
                  {trucks.map((truck) => <option key={truck._id} value={truck._id}>{truck.patente}</option>)}
                </select>
              </label>
              <label className="text-sm">Fecha
                <input name="fecha" type="date" required className={field} />
              </label>
              <label className="text-sm">Importe
                <input name="importe" type="number" min="0.01" max="999999999999" step="0.01" required className={field} />
              </label>
              <label className="text-sm">Moneda
                <select name="moneda" required className={field}>
                  <option>ARS</option><option>USD</option><option>CLP</option>
                </select>
              </label>
            </fieldset>
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            <Button type="submit" color="primary" isLoading={saving} isDisabled={saving}>Registrar carga</Button>
          </form>
        )}
      </div>
    </section>
  );
}
