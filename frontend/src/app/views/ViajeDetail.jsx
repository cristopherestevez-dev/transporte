"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import Link from "next/link";
import api from "@/services/api";

import { HiArrowLeft, HiDownload, HiCurrencyDollar } from "react-icons/hi";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { useAuth } from "@/app/contexts/AuthContext";

export default function ViajeDetail() {
  const { type, id } = useParams();
  const { perfil } = useAuth();
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
          foundTrip =
            viajesNacionales.find((t) => t._id.toString() === id.toString()) ||
            viajesInternacionales.find(
              (t) => t._id.toString() === id.toString(),
            );
        }

        if (foundTrip) {
          // Resolve relationships (Proveedores, Fleteros, Choferes) if IDs exist
          const provider = proveedores?.find(
            (p) => p._id === foundTrip.proveedorId,
          );
          const fletero = fleteros?.find((f) => f._id === foundTrip.fleteroId);
          // Driver logic matches ChoferProfile logic (asignadoId or choferId)
          let driver = null;
          if (foundTrip.tipoAsignacion === "chofer" && foundTrip.asignadoId) {
            driver = choferes?.find((c) => c._id === foundTrip.asignadoId);
          } else if (foundTrip.choferId) {
            driver = choferes?.find((c) => c._id === foundTrip.choferId);
          }

          setEntities({
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

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button isIconOnly variant="light">
              <HiArrowLeft size={24} />
            </Button>
          </Link>
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
          {perfil === "operador_administrativo" && (
            <Button
              color="success"
              className="text-foreground"
              variant="solid"
              startContent={<HiCurrencyDollar />}
            >
              Facturar
            </Button>
          )}
          <Button
            color="primary"
            variant="solid"
            startContent={<HiDownload />}
            onPress={handleDownloadPDF}
          >
            Descargar PDF
          </Button>
        </div>
      </div>

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
                $ {trip.tarifa ? trip.tarifa.toLocaleString() : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
