"use client";
import { AppDialog, DialogHeader, DialogBody, DialogFooter } from "@/app/components/ui/ModalWrapper/AppDialog";
import Button from "@/app/components/ui/Button/button";
import { ArrowLeft } from "lucide-react";


import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import PlanillasChofer from "../components/ui/PlanillasChofer";
import DriverTripTable from "../components/ui/DriverTripTable/DriverTripTable";
import Link from "next/link";
import api from "@/services/api";
import { useAuth } from "@/app/contexts/AuthContext";



// Helper para calcular dias restantes y color (Duplicado o mover a utils compartido)
const LicenseBadge = ({ date }) => {
  if (!date) return <span className="text-gray-400">Sin fecha</span>;

  const today = new Date();
  const expirationDate = new Date(date);
  const diffTime = expirationDate - today;
  const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let colorClass = "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300";
  
  if (daysDiff <= 60) {
    colorClass = "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300";
  } else if (daysDiff <= 90) {
    colorClass = "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300";
  } else if (daysDiff <= 120) {
    colorClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300";
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      {date} ({daysDiff > 0 ? `${daysDiff} días` : "Vencida"})
    </span>
  );
};

const monthParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit",
});

function currentMonth() {
  const parts = monthParts.formatToParts();
  return parts.find(part => part.type === "year").value + "-" + parts.find(part => part.type === "month").value;
}

export default function ChoferProfile({ embeddedDriver, onClosed }) {
  const params = useParams();
  const id = embeddedDriver?._id ?? params.id;
  const { perfil } = useAuth();
  const canClose = ["operador_logistico", "operador_administrativo"].includes(perfil);
  const canReadHistory = canClose;
  const [driver, setDriver] = useState(null);
  const [trips, setTrips] = useState([]);
  const [mes, setMes] = useState(currentMonth);
  const [revision, setRevision] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [message, setMessage] = useState("");
  const [closedMonths, setClosedMonths] = useState([]);
  const monthTrips = trips.filter(trip => (trip.mesPlanilla || trip.fecha_salida?.slice(0, 7)) === mes);

  useEffect(() => {
    if (!id || !canReadHistory) return;
    let active = true;
    api.get("/planillas-chofer?choferId=" + encodeURIComponent(id))
      .then(items => { if (active) setClosedMonths(items.map(item => item.mes)); })
      .catch(error => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, [id, revision, canReadHistory]);

  async function cerrar() {
    if (closing) return;
    setClosing(true);
    setMessage("");
    try {
      await api.post("/planillas-chofer", { choferId: id, mes });
      setClosedMonths(previous => [...previous, mes]);
      setRevision(previous => previous + 1);
      onClosed?.();
      setMes(currentMonth());
      setMessage("Planilla cerrada y guardada en el historial.");
    } catch (error) { setMessage(error.message); }
    finally { setClosing(false); setConfirmOpen(false); }
  }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch chofer from API
        const choferes = embeddedDriver ? [embeddedDriver] : await api.getChoferes();
        const foundDriver = choferes.find((c) => c._id.toString() === id.toString());
        setDriver(foundDriver);

        if (canClose) {
          setTrips(await api.get("/planillas-chofer/chofer/" + encodeURIComponent(id) + "/viajes"));
          return;
        }

        // Fetch viajes from API
        const [viajesNacionales, viajesInternacionales] = await Promise.all([
          api.getViajesNacionales(),
          api.getViajesInternacionales()
        ]);

        const mappedNacionales = (viajesNacionales || []).map(t => ({ ...t, tipoViaje: "nacional" }));
        const mappedInternacionales = (viajesInternacionales || []).map(t => ({ ...t, tipoViaje: "internacional" }));
        const allTrips = [...mappedNacionales, ...mappedInternacionales];
        
        const driverTrips = allTrips.filter((t) => {
            // Logica principal: tipoAsignacion es 'chofer' y el ID coincide
            if (t.tipoAsignacion === 'chofer' && t.asignadoId?.toString() === id.toString()) {
                return true;
            }
            // Logica secundaria (legacy o backup): si hay un campo choferId directo (si existiera)
            if (t.choferId && t.choferId.toString() === id.toString()) {
                return true;
            }
            return false;
        });

        setTrips(driverTrips);
      } catch (error) {
        setMessage(error.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchData();
    }
  }, [id, canClose, embeddedDriver]);

  if (loading) return <div className="p-8">Cargando perfil...</div>;
  if (!driver) return <div className="p-8">Chofer no encontrado.</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {!embeddedDriver && <Button as={Link} href="/choferes" isIconOnly variant="light" aria-label="Volver">
            <ArrowLeft size={24} />
          </Button>}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{driver.nombre}</h1>
          {!embeddedDriver && <div className="flex gap-4 text-sm text-default-500 mt-1">
            <span>DNI: {driver.dni}</span>
            <span>Tel: {driver.telefono}</span>
            <span className="flex items-center gap-2">
                Licencia: <LicenseBadge date={driver.licencia} />
            </span>
          </div>}
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="bg-content1 text-foreground p-4 rounded-lg border border-divider shadow">
        <h2 className="text-lg font-semibold mb-4">Planilla de Viajes</h2>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm">
            Mes de la planilla
            <input type="month" value={mes} onChange={event => setMes(event.target.value || currentMonth())}
              className="rounded-[10px] border border-divider bg-content1 p-2" />
          </label>
          {canClose && <Button type="button" isLoading={closing} isDisabled={!monthTrips.length || closedMonths.includes(mes)}
            onPress={() => setConfirmOpen(true)}>Cerrar planilla</Button>}
        </div>
        {message && <p role="status" className="mb-3 text-sm">{message}</p>}
        {closedMonths.includes(mes) ? <p>La planilla está cerrada. Consultala en Planillas cerradas.</p> : monthTrips.length > 0 ? (
           <DriverTripTable key={mes} trips={monthTrips} />
        ) : (
            <p className="text-default-500 italic">No hay viajes asignados a este chofer en el mes seleccionado.</p>
        )}
      </div>
      <AppDialog isOpen={confirmOpen} onClose={() => { if (!closing) setConfirmOpen(false); }}
        isDismissable={!closing} isKeyboardDismissDisabled={closing}>
        <DialogHeader>Cerrar planilla</DialogHeader>
        <DialogBody>
          <p>La planilla de {driver.nombre} del mes {mes} quedará guardada en el historial para su consulta.</p>
        </DialogBody>
        <DialogFooter>
          <Button variant="light" isDisabled={closing} onPress={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button color="primary" isLoading={closing} onPress={cerrar}>Confirmar cierre</Button>
        </DialogFooter>
      </AppDialog>
      {canReadHistory && !embeddedDriver && <PlanillasChofer choferId={id} revision={revision} />}
    </div>
  );
}
