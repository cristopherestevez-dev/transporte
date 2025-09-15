"use client";

import StatCard from "@/app/components/ui/CardWrapper/StatCard";
import DataTable from "@/app/components/ui/TabWrapper/DataTable";
import { useEffect, useState } from "react";
import { FaTruck, FaBuilding, FaUserTie, FaMapMarkedAlt } from "react-icons/fa";


export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [viajes, setViajes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard`,{cache: "no-store"});

        console.log('Response status:', res.status);
        console.log('Response headers:', res.headers.get('Content-Type'));
        if (!res.ok) {
          throw new Error(`Error HTTP: ${res.status}`);
        }
        console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

        const data = await res.json();
        setStats(data.stats);
        setViajes(data.ultimosViajes);
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };
    fetchData();
  }, []);
  

  if (!stats) {
    return <p className="p-6">Cargando...</p>;
  }

  const columns = ["Origen", "Destino", "Estado", "Fecha"];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-8 border-b pb-4">Dashboard</h1>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <StatCard title="Empresas" value={stats.empresas} icon={<FaBuilding size={28} />} color="bg-blue-500 text-blue-600"className="shadow-md rounded-xl" />
        <StatCard title="Camiones" value={stats.camiones} icon={<FaTruck size={28} />} color="bg-green-500 text-green-600" className="shadow-md rounded-xl" />
        <StatCard title="Choferes" value={stats.choferes} icon={<FaUserTie size={28} />} color="bg-yellow-500 text-yellow-600"className="shadow-md rounded-xl" />
        <StatCard title="Viajes" value={stats.viajes} icon={<FaMapMarkedAlt size={28} />} color="bg-purple-500 text-purple-600" className="shadow-md rounded-xl"/>
      </div>

      {/* Tabla */}
      <DataTable
        title="Últimos Viajes"
        columns={columns}
        data={viajes.map(v => [
          v.origen,
          v.destino,
          <span className={v.estado === "Finalizado" ? "text-green-500" : "text-yellow-500"}>
            {v.estado}
          </span>,
          v.fecha
        ])}
      />
    </div>
  );
}