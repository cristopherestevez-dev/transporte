"use client";

import { Download } from "lucide-react";
import { idViaje } from "@/lib/idViaje";
import { useEffect, useState } from "react";
import api from "@/services/api";
import Button from "./Button/button";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const monthLabel = value => new Intl.DateTimeFormat("es-AR", {
  month: "long", year: "numeric", timeZone: "UTC",
}).format(new Date(value + "-01T00:00:00Z"));

export default function PlanillasChofer({ choferId, revision = 0, resumen = false }) {
  const [planillas, setPlanillas] = useState([]);
  const [descargando, setDescargando] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setDetalle(null);
    setError("");
    const query = choferId ? "?choferId=" + encodeURIComponent(choferId) : "";
    api.get("/planillas-chofer" + query)
      .then(data => { if (active) setPlanillas(data); })
      .catch(error => { if (active) setError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [choferId, revision]);

  async function descargar(planilla) {
    setDescargando(planilla._id);
    setError("");
    try {
      const [data, { crearPdfPlanilla }] = await Promise.all([
        api.get("/planillas-chofer/" + encodeURIComponent(planilla._id)),
        import("./planillaChoferPdf.mjs"),
      ]);
      crearPdfPlanilla(data).save("planilla-viajes-" + planilla.mes + ".pdf");
    } catch (error) {
      setError(error.message);
    } finally {
      setDescargando(null);
    }
  }

  async function abrir(id) {
    setError("");
    try { setDetalle(await api.get("/planillas-chofer/" + encodeURIComponent(id))); }
    catch (error) { setError(error.message); }
  }

  return (
    <details className="rounded-[10px] border border-divider bg-content1 p-4">
      <summary className="cursor-pointer font-semibold">Planillas cerradas</summary>
      {error && <p role="alert" className="mt-3 text-danger">{error}</p>}
      {loading ? <p className="mt-3">Cargando planillas…</p> : (
        <ul className="mt-3 space-y-2">
          {planillas.map(planilla => (
            <li key={planilla._id} className="flex items-center justify-between gap-2">
              <Button native type="button" className="min-w-0 whitespace-normal break-words px-2 py-1 text-left text-primary hover:underline" onClick={() => abrir(planilla._id)}>
                {monthLabel(planilla.mes)} · {planilla.chofer} · {money.format(planilla.neto)}
              </Button>
              {resumen && (
                <Button type="button" isIconOnly variant="light" className="size-11 shrink-0" isLoading={descargando === planilla._id}
                  isDisabled={descargando !== null} onPress={() => descargar(planilla)}
                  aria-label={"Descargar PDF de " + monthLabel(planilla.mes)} title="Descargar planilla en PDF">
                  <Download className="size-4 shrink-0 sm:size-5" aria-hidden="true" />
                </Button>
              )}
            </li>
          ))}
          {!planillas.length && !error && <li className="text-sm text-default-500">Todavía no hay planillas cerradas.</li>}
        </ul>
      )}
      {detalle && (
        <div className="mt-4 space-y-3">
          <h3 className="font-semibold">{detalle.chofer} · {monthLabel(detalle.mes)}</h3>
          <p>Total liquidado · {money.format(detalle.neto)}</p>
          {resumen ? <p className="text-sm text-default-500">{detalle.viajes.length} {detalle.viajes.length === 1 ? "viaje" : "viajes"} en la planilla</p> : <div className="table-frame">
            <table className="w-full text-sm">
              <thead className="bg-content2"><tr>
                {["ID", "Salida", "Tipo", "Origen", "Destino", "Carga", "Estado", "Patente camión", "Patente semi", "Chofer (AR)", "Total chofer", "Adelanto", "Neto (ARS)"].map(label => <th key={label} className="p-2 text-left whitespace-nowrap">{label}</th>)}
              </tr></thead>
              <tbody>{detalle.viajes.map(viaje => (
                <tr key={viaje.tipo + ":" + viaje._id} className="border-t border-divider">
                  {[idViaje(viaje.numeroOperativo, viaje.tipo), viaje.fecha_salida, viaje.tipo, viaje.origen, viaje.destino, viaje.carga, viaje.estado, viaje.camionPatente, viaje.semirremolquePatente,
                    ...[viaje.tarifaChoferAr, viaje.totalChofer, viaje.adelantoAr, viaje.estado === "cancelado" ? 0 : viaje.pago].map(value => value == null ? null : money.format(value)),
                  ].map((value, index) => <td key={index} className="p-2">{value || "—"}</td>)}
                </tr>
              ))}</tbody>
            </table>
          </div>}
        </div>
      )}
    </details>
  );
}
