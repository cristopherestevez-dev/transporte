"use client";
import { idViaje } from "@/lib/idViaje";
import Button from "@/app/components/ui/Button/button";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";


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


import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";

import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { tienePermiso } = useAuth();
  const canViewTrips = tienePermiso("viajes");
  const [stats, setStats] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [page, setPage] = useState(0);
  const [tripsPage, setTripsPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 5, total: 0, totalPages: 0 });
  const [tripFilters, setTripFilters] = useState({});
  const [tripsLoading, setTripsLoading] = useState(false);
  const [tripsError, setTripsError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsData = await api.getStats();
        
        setStats(statsData);
      } catch (error) {
        console.error("Error al cargar el dashboard:", error);
      }
    };

    fetchData();
  }, [canViewTrips]);
  useEffect(() => {
    if (!canViewTrips) return;
    let current = true; setTripsLoading(true); setTripsError('');
    api.getRecentTrips({ page: tripsPage, pageSize, ...tripFilters }).then(result => {
      if (!current) return;
      if (result.pagination.totalPages && tripsPage > result.pagination.totalPages) { setTripsPage(result.pagination.totalPages); return; }
      setViajes(result.data); setPagination(result.pagination);
    }).catch(error => { if (current) setTripsError(error.message); }).finally(() => { if (current) setTripsLoading(false); });
    return () => { current = false; };
  }, [canViewTrips, tripsPage, pageSize, tripFilters]);

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
      onClick: () => router.push("/configuracion"),
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

  const columns = ["ID", "Origen", "Destino", "Estado", "Fecha", "Patente camión", "Patente semi", "Acciones"];

  return (
    <div className="p-8 bg-background min-h-screen transition-colors duration-300">
      <h1 className="text-4xl font-extrabold text-foreground mb-8 border-b border-divider pb-4">
        Dashboard
      </h1>

      {/* 1. Clima Hero */}
      <div className="mb-8 w-full">
        <WeatherWidget mode="card" className="w-full" />
      </div>

      {/* 2. Tabla de últimos viajes */}
        {canViewTrips && <div className="mb-8">
        {tripsError && <p role="alert" className="text-danger mb-3">{tripsError}</p>}
        <DataTable
              title="Últimos Viajes"
              pagination={pagination}
              onPageChange={setTripsPage}
              onPageSizeChange={value => { setPageSize(value); setTripsPage(1); }}
              filterFields={[
                { key: "col_origen", label: "Origen" },
                { key: "col_destino", label: "Destino" },
                { key: "col_estado", label: "Estado", options: [
                  { value: "pendiente", label: "Pendiente" },
                  { value: "en_transito", label: "En tránsito" },
                  { value: "finalizado", label: "Finalizado" },
                  { value: "cancelado", label: "Cancelado" },
                ] },
                { key: "col_fecha_salida", label: "Fecha", type: "date" },
                { key: "col_camionPatente", label: "Patente camión" },
                { key: "col_semirremolquePatente", label: "Patente semi" },
              ]}
              filters={tripFilters}
              onFiltersChange={values => { setTripFilters(values); setTripsPage(1); }}
              loading={tripsLoading}
            columns={columns}
            data={viajes.map((v) => [
            idViaje(v.numeroOperativo, v.type),
            v.origen,
            v.destino,
            <span
                className={`font-bold ${
                v.estado === "finalizado" ? "text-success" : 
                v.estado === "en_transito" ? "text-primary" :
                "text-warning"
                }`}
            >
                {v.estado === "finalizado" ? "Finalizado" : 
                 v.estado === "en_transito" ? "En Tránsito" : 
                 "Pendiente"}
            </span>,
            v.fecha_salida,
            v.camionPatente || "—",
            v.semirremolquePatente || "—",
            <Link href={`/viajes/${v.type}/${v._id}`}>
               <div className="flex justify-center text-default-500 hover:text-primary transition cursor-pointer">
                   <Eye size={20} />
               </div>
            </Link>
            ])}
        />
      </div>}

      {/* 3. Carrusel de cards */}
      <h2 className="text-2xl font-bold text-foreground mb-4 px-2">Métricas Rápidas</h2>
      <div className="flex items-center mb-12 gap-4 w-full">
        <Button native
          onClick={scrollLeft}
          className="bg-content1 p-2 rounded-full shadow hover:bg-content2 text-foreground transition shrink-0"
        >
          <ChevronLeft size={24} />
        </Button>

        <div className="min-w-0 flex-1 overflow-hidden px-1 pb-2"> 
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={page}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
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

        <Button native
          onClick={scrollRight}
          className="bg-content1 p-2 rounded-full shadow hover:bg-content2 text-foreground transition shrink-0"
        >
          <ChevronRight size={24} />
        </Button>
      </div>
    </div>
  );
}
