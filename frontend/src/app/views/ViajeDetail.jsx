"use client";
import Button from "@/app/components/ui/Button/button";
import { ArrowLeft, Download } from "lucide-react";


import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/services/api";


import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { useAuth } from "@/app/contexts/AuthContext";
import { amounts } from "@/lib/balance.mjs";
import ViajeCombustible from "./ViajeCombustible";

const normalizeTaxId = (value) => String(value ?? "").replace(/[\s.-]/g, "").toUpperCase();

function matchInvoice(rows, { taxId, number, invoiceType }) {
  const matches = rows.filter((row) =>
    normalizeTaxId(row.cuit) === taxId &&
    row.numero_comprobante?.trim() === number &&
    row.tipo_comprobante === invoiceType,
  );
  if (matches.length > 1) return { status: "ambiguous" };
  if (!matches.length) return { status: "missing" };
  return { status: "found", invoice: matches[0] };
}

function invoiceStatus(invoice, isReceived) {
  if (invoice.estado === "pagado") return "Pagado";
  if (invoice.estado === "cobrado") return "Cobrado";
  if (invoice.estado === "pago_parcial") return isReceived ? "Pago parcial" : "Cobro parcial";
  if (invoice.estado === "vencido") return "Vencido";
  if (invoice.estado !== "pendiente") return "Sin estado registrado";

  const dueDate = new Date(invoice.fecha + "T00:00:00");
  dueDate.setDate(dueDate.getDate() + (invoice.plazo ?? 30));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today ? "Vencido" : "Pendiente";
}

const invoiceMessages = {
  loading: "Consultando comprobante…",
  missing: "Comprobante no encontrado en Facturación",
  ambiguous: "Hay varios comprobantes con esos datos",
  error: "No se pudo consultar Facturación",
};

function TripInvoiceStatus({ canRead, isReceived, scope, taxId, number, invoiceType }) {
  const [result, setResult] = useState({ status: "loading" });
  const tab = isReceived ? "pagos" : "cobranzas";
  const validScope = scope === "nacional" || scope === "internacional";
  const canLookUp = canRead && validScope && Boolean(taxId && number && invoiceType);

  useEffect(() => {
    if (!canLookUp) return;
    let active = true;
    api.get("/facturacion/" + tab + "/" + scope + "es")
      .then((rows) => {
        if (active) setResult(matchInvoice(rows, { taxId, number, invoiceType }));
      })
      .catch(() => {
        if (active) setResult({ status: "error" });
      });
    return () => { active = false; };
  }, [canLookUp, tab, scope, taxId, number, invoiceType]);

  if (!canRead) return <dd className="text-sm">Disponible con acceso a Facturación</dd>;

  const invoice = canLookUp ? result.invoice : null;
  const values = invoice ? amounts(invoice) : null;
  const format = (cents) => {
    const currency = invoice.moneda;
    const options = currency ? { style: "currency", currency, currencyDisplay: "code" } : {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
    return (cents / 100).toLocaleString("es-AR", options);
  };

  let message = "Faltan datos para identificar el comprobante";
  if (canLookUp) {
    message = invoice ? invoiceStatus(invoice, isReceived) : invoiceMessages[result.status];
  } else if (!number) {
    message = "Sin número de factura registrado";
  }

  return (
    <>
      <dd className="text-sm font-medium" aria-live="polite">{message}</dd>
      {values && (
        <dd className="mt-1 space-y-1 text-sm">
          <p>{isReceived ? "Pagado" : "Cobrado"} {format(values.paid)}</p>
          <p>Pendiente {format(values.pending)}</p>
          {!invoice.moneda && <p className="text-foreground/70">Moneda sin definir</p>}
        </dd>
      )}
      <dd className="mt-2 text-sm">
        <Link
          className="text-primary underline underline-offset-2"
          href={{ pathname: "/facturacion", query: { tab, ambito: scope } }}
        >
          Ver {isReceived ? "pagos" : "cobranzas"}
        </Link>
      </dd>
    </>
  );
}

function TripSettlementStatus({ tripId, scope, isFinished }) {
  const [settlement, setSettlement] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    api.get("/liquidaciones/por-viaje/" + scope + "/" + encodeURIComponent(tripId))
      .then((data) => { if (active) setSettlement(data); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [scope, tripId]);

  if (failed) return <dd className="mt-2 text-sm">No se pudo consultar la liquidación</dd>;
  if (!settlement) return <dd className="mt-2 text-sm">Consultando liquidación…</dd>;

  const comprobanteId = settlement.comprobanteId;
  if (!comprobanteId && !isFinished) return null;
  return (
    <dd className="mt-2 text-sm">
      <Link
        className="text-primary underline underline-offset-2"
        href={{
          pathname: "/viajes/liquidaciones",
          query: comprobanteId ? { comprobante: comprobanteId } : undefined,
        }}
      >
        {comprobanteId ? "Ver comprobante de liquidación" : "Ir a liquidación agrupada"}
      </Link>
    </dd>
  );
}

export default function ViajeDetail() {
  const { type, id } = useParams();
  const { tienePermiso } = useAuth();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState({}); // To store resolved names (driver, provider, truck)

  useEffect(() => {
    async function fetchTrip() {
      try {
        // Fetch all necessary data from API
        const [
          viajesNacionales,
          viajesInternacionales,
          proveedores,
          fleteros,
          choferes,
        ] = await Promise.all([
          api.getViajesNacionales(),
          api.getViajesInternacionales(),
          api.getProveedores(),
          api.getFleteros(),
          api.getChoferes(),
        ]);

        let foundTrip = null;
        let tripScope = type;

        // Determine list based on type
        if (type === "nacional") {
          foundTrip = viajesNacionales.find(
            (t) => t._id.toString() === id.toString(),
          );
        } else if (type === "internacional") {
          foundTrip = viajesInternacionales.find(
            (t) => t._id.toString() === id.toString(),
          );
        } else {
          // Fallback: try searching both if type logic fails or url is manual
          foundTrip = viajesNacionales.find((t) => t._id.toString() === id.toString());
          tripScope = foundTrip ? "nacional" : "internacional";
          foundTrip ||= viajesInternacionales.find((t) => t._id.toString() === id.toString());
        }

        if (foundTrip) {
          // Resolve relationships (Proveedores, Fleteros, Choferes) if IDs exist
          const provider = proveedores?.find(
            (p) => p._id === foundTrip.proveedorId,
          );
          const fletero = fleteros?.find((f) => foundTrip.tipoAsignacion === "fletero" && f._id === foundTrip.asignadoId);
          // Driver logic matches ChoferProfile logic (asignadoId or choferId)
          let driver = null;
          if (foundTrip.tipoAsignacion === "chofer" && foundTrip.asignadoId) {
            driver = choferes?.find((c) => c._id === foundTrip.asignadoId);
          } else if (foundTrip.choferId) {
            driver = choferes?.find((c) => c._id === foundTrip.choferId);
          }

          setEntities({
            scope: tripScope,
            invoiceTaxId: normalizeTaxId(
              foundTrip.direccion_facturacion === "recibida" && foundTrip.tipoAsignacion === "fletero"
                ? fletero?.cuil_cuit
                : provider?.cuil_cuit,
            ),
            providerName: provider?.nombre || "N/A",
            fleteroName: fletero?.nombre || "N/A",
            driverName: driver?.nombre || "N/A",
            truck: foundTrip.patenteCamion || "N/A",
            trailer: foundTrip.patenteSemi || "N/A",
          });
          setTrip(foundTrip);
        }
      } catch (error) {
        console.error("Error fetching trip:", error);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchTrip();
  }, [type, id]);

  const handleDownloadPDF = async () => {
    const element = document.getElementById("trip-detail-content");
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`viaje-${id}-${type}.pdf`);
  };

  if (loading) return <div className="p-8">Cargando detalles del viaje...</div>;
  if (!trip) return <div className="p-8">Viaje no encontrado.</div>;

  const hasAssignment = Boolean(
    (trip.asignadoId && ["chofer", "fletero"].includes(trip.tipoAsignacion)) ||
      trip.choferId,
  );
  const isReceived = trip.direccion_facturacion === "recibida";
  const invoiceNumber = trip.numero_comprobante?.trim();
  const operationStatus = {
    pendiente: "Pendiente de iniciar",
    en_transito: "En tránsito",
    finalizado: "Finalizado",
    cancelado: "Cancelado",
  }[trip.estado] ?? "Sin estado";
  const formatAmount = (amount, currency) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(amount);

  const settlement = [
    { label: "Total chofer", amount: trip.totalChofer, currency: "ARS" },
    {
      label: "Adelanto",
      amount: trip.adelantoMonto,
      currency: trip.adelantoMoneda,
    },
  ].filter(({ amount }) => Number.isFinite(amount));

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button as={Link} href="/dashboard" isIconOnly variant="light" aria-label="Volver">
              <ArrowLeft size={24} />
            </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Detalle del Viaje #{trip._id?.slice(-6)}
            </h1>
            <p className="text-foreground/50 capitalize">
              {type} - {trip.estado}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            color="primary"
            variant="solid"
            startContent={<Download />}
            onPress={handleDownloadPDF}
          >
            Descargar PDF
          </Button>
        </div>
      </div>

      <section
        aria-labelledby="trip-progress-title"
        className="space-y-3 rounded-xl border border-divider bg-content1 p-4"
      >
        <h2 id="trip-progress-title" className="text-lg font-semibold">
          Seguimiento del viaje
        </h2>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-content2 p-3">
            <dt className="text-sm text-foreground/70">Operación</dt>
            <dd className="font-medium">{operationStatus}</dd>
            {!hasAssignment && trip.estado === "pendiente" && (
              <dd className="text-sm">Pendiente de asignar</dd>
            )}
          </div>
          <div className="rounded-lg bg-content2 p-3">
            <dt className="text-sm text-foreground/70">Liquidación</dt>
            {settlement.length === 0 ? (
              <dd className="font-medium">Sin importes registrados</dd>
            ) : (
              settlement.map(({ label, amount, currency }) => (
                <dd key={label} className="text-sm">
                  {label}{" "}
                  <span className="font-medium">
                    {["ARS", "USD", "CLP"].includes(currency)
                      ? formatAmount(amount, currency)
                      : amount.toLocaleString("es-AR")}
                  </span>
                </dd>
              ))
            )}
            {tienePermiso("viajes") && entities.scope && (
              <TripSettlementStatus
                key={entities.scope + ":" + trip._id}
                tripId={trip._id}
                scope={entities.scope}
                isFinished={trip.estado === "finalizado"}
              />
            )}
          </div>
          <div className="rounded-lg bg-content2 p-3">
            <dt className="text-sm text-foreground/70">Factura</dt>
            <dd className="break-words font-medium">
              {invoiceNumber
                ? invoiceNumber
                : "Sin número de factura registrado"}
            </dd>
          </div>
          <div className="rounded-lg bg-content2 p-3">
            <dt className="text-sm text-foreground/70">
              {isReceived ? "Pago" : "Cobro"}
            </dt>
            <TripInvoiceStatus
              key={JSON.stringify([trip._id, entities.scope, isReceived, entities.invoiceTaxId, invoiceNumber, trip.tipo_comprobante])}
              canRead={tienePermiso("facturacion")}
              isReceived={isReceived}
              scope={entities.scope}
              taxId={entities.invoiceTaxId}
              number={invoiceNumber}
              invoiceType={trip.tipo_comprobante}
            />
          </div>
        </dl>
      </section>

      <ViajeCombustible
        key={entities.scope + "/" + trip._id}
        trip={trip}
        scope={entities.scope}
        canRegister={tienePermiso("viajes")}
        onSaved={(saved) => setTrip((current) => current?._id === saved._id ? saved : current)}
      />

      <div
        id="trip-detail-content"
        className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-content2/50 rounded-xl"
      >
        {/* Card: Ruta y Fechas */}
        <div className="bg-content1 p-6 rounded-lg shadow border border-divider space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">
            Información de Ruta
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-foreground/50">Origen</p>
              <p className="font-medium text-lg">{trip.origen}</p>
            </div>
            <div>
              <p className="text-sm text-foreground/50">Destino</p>
              <p className="font-medium text-lg">{trip.destino}</p>
            </div>
            <div>
              <p className="text-sm text-foreground/50">Fecha Salida</p>
              <p className="font-medium">{trip.fecha_salida}</p>
            </div>
            <div>
              <p className="text-sm text-foreground/50">Fecha Llegada</p>
              <p className="font-medium">{trip.fecha_llegada || "-"}</p>
            </div>
          </div>
        </div>

        {/* Card: Carga y Entidades */}
        <div className="bg-content1 p-6 rounded-lg shadow border border-divider space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">
            Detalles Operativos
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-foreground/50">Carga / Contenedor:</span>
              <span className="font-medium">
                {trip.carga || "No especificado"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/50">Proveedor:</span>
              <span className="font-medium">{entities.providerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/50">Fletero:</span>
              <span className="font-medium">{entities.fleteroName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/50">Chofer Asignado:</span>
              <span className="font-medium text-blue-600">
                {entities.driverName}
              </span>
            </div>
          </div>
        </div>

        {/* Card: Vehículos (Si aplica) */}
        <div className="bg-content1 p-6 rounded-lg shadow border border-divider space-y-4 md:col-span-2">
          <h2 className="text-lg font-semibold border-b pb-2">
            Recursos Asignados
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-foreground/50">Camión</p>
              <p className="font-bold">{entities.truck}</p>
            </div>
            <div>
              <p className="text-sm text-foreground/50">Semirremolque</p>
              <p className="font-bold">{entities.trailer}</p>
            </div>
            {/* More fields can be added here */}
            <div>
              <p className="text-sm text-foreground/50">Km Estimados</p>
              <p className="font-bold">{trip.km || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-foreground/50">Tarifa Acordada</p>
              <p className="font-bold">
                {type === "internacional" ? "USD" : "ARS"} {(type === "internacional" ? trip.tarifaTotalUsd : trip.tarifaTotalAr)?.toLocaleString() ?? "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
