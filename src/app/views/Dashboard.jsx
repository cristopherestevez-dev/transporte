"use client";

import StatCard from "@/app/components/ui/CardWrapper/StatCard";
import DataTable from "@/app/components/ui/TabWrapper/DataTable";
import { useEffect, useState } from "react";
import { FaTruck, FaBuilding, FaUserTie, FaMapMarkedAlt } from "react-icons/fa";
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";
import { useRouter } from "next/navigation";
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [page, setPage] = useState(0); // Página del carrusel
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/db.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

        const data = await res.json();

        const statsData = {
          proveedores: data.proveedores?.length || 0,
          fleteros: data.fleteros?.length || 0,
          camiones: data.camiones?.length || 0,
          choferes: data.choferes?.length || 0,
          viajes:
            (data.viajesNacionales?.length || 0) +
            (data.viajesInternacionales?.length || 0),
          semirremolques: data.semirremolques?.length || 0,
          users: data.users?.length || 0,
        };

        const ultimosViajes = [
          ...(data.viajesNacionales || []),
          ...(data.viajesInternacionales || []),
        ]
          .sort((a, b) => new Date(b.fecha_salida) - new Date(a.fecha_salida))
          .slice(0, 5);

        setStats(statsData);
        setViajes(ultimosViajes);
      } catch (error) {
        console.error("Error al cargar el dashboard:", error);
      }
    };

    fetchData();
  }, []);

  if (!stats) return <p className="p-6">Cargando...</p>;

  const cards = [
    {
      title: "Proveedores",
      value: stats.proveedores,
      icon: <FaBuilding size={28} />,
      color: "bg-blue-500 text-blue-600",
      onClick: () => router.push("/empresas"),
    },
    {
      title: "Fleteros",
      value: stats.fleteros,
      icon: <FaUserTie size={28} />,
      color: "bg-teal-500 text-teal-600",
      onClick: () => router.push("/empresas"),
    },
    {
      title: "Camiones",
      value: stats.camiones,
      icon: <FaTruck size={28} />,
      color: "bg-green-500 text-green-600",
      onClick: () => router.push("/camiones"),
    },
    {
      title: "Semis",
      value: stats.semirremolques,
      icon: <FaTruck size={28} />,
      color: "bg-red-500 text-red-600",
      onClick: () => router.push("/camiones"),
    },
    {
      title: "Choferes",
      value: stats.choferes,
      icon: <FaUserTie size={28} />,
      color: "bg-yellow-500 text-yellow-600",
      onClick: () => router.push("/choferes"),
    },
    {
      title: "Viajes",
      value: stats.viajes,
      icon: <FaMapMarkedAlt size={28} />,
      color: "bg-purple-500 text-purple-600",
      onClick: () => router.push("/viajes"),
    },
    {
      title: "Usuarios",
      value: stats.users,
      icon: <FaUserTie size={28} />,
      color: "bg-indigo-500 text-indigo-600",
      onClick: () => router.push("/usuarios"),
    },
  ];

  const cardsPerPage = 4;
  const totalPages = Math.ceil(cards.length / cardsPerPage);

  const visibleCards = cards.slice(
    page * cardsPerPage,
    page * cardsPerPage + cardsPerPage
  );

  const scrollLeft = () =>
    setPage((prev) => (prev - 1 + totalPages) % totalPages);
  const scrollRight = () => setPage((prev) => (prev + 1) % totalPages);

  const columns = ["Origen", "Destino", "Estado", "Fecha"];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-8 border-b pb-4">
        Dashboard
      </h1>

      {/* Carrusel de cards */}
      <div className="flex items-center mb-8 gap-4">
        <button
          onClick={scrollLeft}
          className="bg-white p-2 rounded-full shadow hover:bg-gray-100 transition"
        >
          <HiOutlineChevronLeft size={24} />
        </button>

        {visibleCards.map((c, index) => (
          <div
            key={index}
            onClick={c.onClick}
            className="cursor-pointer"
          >
            <StatCard
              title={c.title}
              value={c.value}
              icon={c.icon}
              color={c.color}
              className="shadow-md rounded-xl"
            />
          </div>
        ))}

        <button
          onClick={scrollRight}
          className="bg-white p-2 rounded-full shadow hover:bg-gray-100 transition"
        >
          <HiOutlineChevronRight size={24} />
        </button>
      </div>

      {/* Tabla de últimos viajes */}
      <DataTable
        title="Últimos Viajes"
        columns={columns}
        data={viajes.map((v) => [
          v.origen,
          v.destino,
          <span
            className={
              v.estado === "completado" ? "text-green-500" : 
              v.estado === "en progreso" ? "text-blue-500" :
              v.estado=== "cancelado" ? "text-red-500" :
              "text-yellow-500"
            }
          >
            {v.estado}
          </span>,
          v.fecha,
        ])}
      />
    </div>
  );
}
