"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/app/components/ui/Button/button";
import { AppDialog, DialogHeader, DialogBody, DialogFooter } from "@/app/components/ui/ModalWrapper/AppDialog";
import api from "@/services/api";

const field = "w-full rounded-[10px] border border-divider bg-content2 p-2";

export default function TripInvoicePayment({ trip, scope }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({ fecha: "", moneda: "", monto: "", plazo: "30" });
  const issuer = trip.tipoAsignacion === "fletero" ? trip.asignadoId : trip.proveedorId;
  const ready = Boolean(trip.tipo_comprobante && trip.numero_comprobante && issuer);
  const change = event => setForm(previous => ({ ...previous, [event.target.name]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    if (saving || !ready || result) return;
    setSaving(true);
    setError("");
    try {
      setResult(await api.post("/facturacion/pagos/" + scope + "/desde-viaje/" + (trip._id || trip.id), {
        ...form, monto: Number(form.monto), plazo: Number(form.plazo),
      }));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }

  return <>
    <Button native type="button" className="px-2 text-sm text-primary" onClick={() => setOpen(true)}>Registrar en Pagos</Button>
    <AppDialog isOpen={open} onClose={() => { if (!saving) setOpen(false); }} isDismissable={!saving} isKeyboardDismissDisabled={!saving}>
      <form onSubmit={submit}>
        <DialogHeader>Registrar factura recibida</DialogHeader>
        <DialogBody>
          <p className="text-sm text-default-500">{trip.proveedor || "Emisor sin seleccionar"} · {trip.numero_comprobante || "Sin número de factura"}</p>
          {result ? (
            <p role="status">{result.created ? "La factura quedó registrada en Pagos." : "La factura ya figura en Pagos."}</p>
          ) : ready ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1">Fecha de la factura<input className={field} name="fecha" type="date" value={form.fecha} onChange={change} required disabled={saving} /></label>
              <label className="grid gap-1">Moneda<select className={field} name="moneda" value={form.moneda} onChange={change} required disabled={saving}>
                <option value="">Seleccionar</option><option value="ARS">ARS</option><option value="USD">USD</option><option value="CLP">CLP</option>
              </select></label>
              <label className="grid gap-1">Total de la factura<input className={field} name="monto" type="number" min="0.01" step="0.01" value={form.monto} onChange={change} required disabled={saving} /></label>
              <label className="grid gap-1">Plazo de pago (días)<input className={field} name="plazo" type="number" min="0" max="3650" value={form.plazo} onChange={change} required disabled={saving} /></label>
            </div>
          ) : <p>Editá el viaje y completá el emisor, el tipo y el número de factura.</p>}
          {error && <p role="alert" className="text-danger">{error}</p>}
        </DialogBody>
        <DialogFooter>
          <Button native type="button" disabled={saving} onClick={() => setOpen(false)}>Cerrar</Button>
          {result ? <Link className="rounded-[10px] bg-brand-navy px-3 py-2 text-white" href={"/facturacion?tab=pagos&ambito=" + (scope === "internacionales" ? "internacional" : "nacional")}>Ver Pagos</Link>
            : ready && <Button type="submit" color="primary" isLoading={saving} disabled={saving}>Registrar factura</Button>}
        </DialogFooter>
      </form>
    </AppDialog>
  </>;
}
