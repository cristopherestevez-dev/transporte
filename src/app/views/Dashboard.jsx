"use client";

import StatCard from "@/app/components/ui/CardWrapper/StatCard";
import DataTable from "@/app/components/ui/TabWrapper/DataTable";
import { useEffect, useState } from "react";
import {
  IconBuilding,
  IconTruck,
  IconTrailer,
  IconDriver,
  IconRoutes,
  IconUsers,
} from "@/app/components/ui/Icons/Icons";
import WeatherWidget from "@/app/components/ui/WeatherWidget/WeatherWidget";

import { HiOutlineChevronLeft, HiOutlineChevronRight, HiEye } from "react-icons/hi";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
          ...(data.viajesNacionales || []).map(v => ({...v, type: 'nacional'})),
          ...(data.viajesInternacionales || []).map(v => ({...v, type: 'internacional'})),
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
      icon: <IconBuilding />,
      color: "bg-blue-500 text-blue-600",
      onClick: () => router.push("/empresas"),
    },
    {
      title: "Fleteros",
      value: stats.fleteros,
      icon: <IconDriver />,
      color: "bg-teal-500 text-teal-600",
      onClick: () => router.push("/empresas"),
    },
    {
      title: "Camiones",
      value: stats.camiones,
      icon: <IconTruck />,
      color: "bg-green-500 text-green-600",
      onClick: () => router.push("/camiones"),
    },
   
    {
      title: "Choferes",
      value: stats.choferes,
      icon: <IconDriver />,
      color: "bg-yellow-500 text-yellow-600",
      onClick: () => router.push("/choferes"),
    },
    {
      title: "Viajes",
      value: stats.viajes,
      icon: <IconRoutes />,
      color: "bg-purple-500 text-purple-600",
      onClick: () => router.push("/viajes"),
    },
    {
      title: "Usuarios",
      value: stats.users,
      icon: <IconUsers />,
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

  const columns = ["Origen", "Destino", "Estado", "Fecha", "Acciones"];

  return (
    <div className="p-8 bg-background min-h-screen transition-colors duration-300">
      <h1 className="text-4xl font-extrabold text-foreground mb-8 border-b border-divider pb-4">
        Dashboard
      </h1>

      {/* 1. Clima Hero */}
      <div className="mb-8 w-full">
        <WeatherWidget mode="card" className="w-full" />
      </div>

      {/* 2. Tabla de últimos viajes (Ahora arriba del carrusel) */}
      <div className="mb-8">
        <DataTable
            title="Últimos Viajes"
            columns={columns}
            data={viajes.map((v) => [
            v.origen,
            v.destino,
            <span
                className={`font-bold ${
                v.estado === "finalizado" ? "text-success" : 
                v.estado === "en_transito" ? "text-primary" :
                "text-warning" // pendiente
                }`}
            >
                {v.estado === "finalizado" ? "Finalizado" : 
                 v.estado === "en_transito" ? "En Tránsito" : 
                 "Pendiente"}
            </span>,
            v.fecha_salida, 
            <Link href={`/viajes/${v.type}/${v.id}`}>
               <div className="flex justify-center text-default-500 hover:text-primary transition cursor-pointer">
                   <HiEye size={20} />
               </div>
            </Link>
            ])}
        />
      </div>

      {/* 3. Carrusel de cards (Ahora abajo) */}
      <h2 className="text-2xl font-bold text-foreground mb-4 px-2">Métricas Rápidas</h2>
      <div className="flex items-center mb-12 gap-4 w-full">
        <button
          onClick={scrollLeft}
          className="bg-content1 p-2 rounded-full shadow hover:bg-content2 text-foreground transition shrink-0"
        >
          <HiOutlineChevronLeft size={24} />
        </button>

        <div className="flex-1 overflow-hidden relative" style={{ minHeight: "160px" }}> 
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={page}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 absolute w-full"
            >
              {visibleCards.map((c, index) => (
                <div
                  key={index}
                  onClick={c.onClick}
                  className="cursor-pointer w-full"
                >
                  <StatCard
                    title={c.title}
                    value={c.value}
                    icon={c.icon}
                    color={c.color}
                    className="shadow-md rounded-xl h-full"
                  />
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={scrollRight}
          className="bg-content1 p-2 rounded-full shadow hover:bg-content2 text-foreground transition shrink-0"
        >
          <HiOutlineChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}
