"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import DriverTripTable from "../components/ui/DriverTripTable/DriverTripTable";
import { Button } from "@heroui/react";
import Link from "next/link";

import { HiArrowLeft } from "react-icons/hi";

// Helper para calcular dias restantes y color (Duplicado o mover a utils compartido)
const LicenseBadge = ({ date }) => {
  if (!date) return <span className="text-gray-400">Sin fecha</span>;

  const today = new Date();
  const expirationDate = new Date(date);
  const diffTime = expirationDate - today;
  const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let colorClass = "bg-green-100 text-green-800";
  
  if (daysDiff <= 60) {
    colorClass = "bg-red-100 text-red-800";
  } else if (daysDiff <= 90) {
    colorClass = "bg-orange-100 text-orange-800";
  } else if (daysDiff <= 120) {
    colorClass = "bg-yellow-100 text-yellow-800";
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      {date} ({daysDiff > 0 ? `${daysDiff} días` : "Vencida"})
    </span>
  );
};

export default function ChoferProfile() {
  const { id } = useParams();
  const [driver, setDriver] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/db.json");
        const data = await res.json();

        // 1. Encontrar el chofer
        const foundDriver = data.choferes.find((c) => c.id.toString() === id.toString());
        setDriver(foundDriver);

        // 2. Filtrar viajes asignados a este chofer
        // Cargar viajes desde localStorage o usar db.json si no existen
        const storedNacionales = localStorage.getItem("viajesNacionales");
        const storedInternacionales = localStorage.getItem("viajesInternacionales");
        
        const viajesNacionales = storedNacionales ? JSON.parse(storedNacionales) : (data.viajesNacionales || []);
        const viajesInternacionales = storedInternacionales ? JSON.parse(storedInternacionales) : (data.viajesInternacionales || []);

        const allTrips = [...viajesNacionales, ...viajesInternacionales];
        
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
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading) return <div className="p-8">Cargando perfil...</div>;
  if (!driver) return <div className="p-8">Chofer no encontrado.</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/choferes">
          <Button isIconOnly variant="light">
            <HiArrowLeft size={24} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{driver.nombre}</h1>
          <div className="flex gap-4 text-sm text-gray-500 mt-1">
            <span>DNI: {driver.dni}</span>
            <span>Tel: {driver.telefono}</span>
            <span className="flex items-center gap-2">
                Licencia: <LicenseBadge date={driver.licencia} />
            </span>
          </div>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Planilla de Viajes</h2>
        {trips.length > 0 ? (
           <DriverTripTable trips={trips} />
        ) : (
            <p className="text-gray-500 italic">No hay viajes asignados a este chofer.</p>
        )}
      </div>
    </div>
  );
}
