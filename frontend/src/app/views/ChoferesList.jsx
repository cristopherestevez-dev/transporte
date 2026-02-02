"use client";

import CrudTable from "../components/ui/CrudTable/CrudTable";
import TabsWrapper from "../components/ui/TabsWrapper/TabsWrapper";
import { useState , useEffect } from "react";
import Link from "next/link";
import api from "@/services/api";

// Helper para calcular dias restantes y color
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

export default function ChoferesList() {
  const [choferes, setChoferes] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [choferesData, viajesNac, viajesInt] = await Promise.all([
          api.getChoferes(),
          api.getViajesNacionales(),
          api.getViajesInternacionales()
        ]);
        setChoferes(choferesData || []);
        setTrips([...(viajesNac || []), ...(viajesInt || [])]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <p>Cargando datos...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <TabsWrapper
      tabs={[
        {
          label: "Choferes",
          content: (
            <CrudTable
              title="Choferes"
              key="choferes"
              data={choferes}
              setData={setChoferes}
              apiUrl="http://localhost:3001/api/choferes"
              columns={[
                { 
                  label: "Nombre", 
                  key: "nombre",
                  render: (value, row) => (
                    <Link href={`/choferes/${row._id}`} className="text-blue-600 hover:underline font-semibold">
                      {value}
                    </Link>
                  )
                },
                { label: "DNI", key: "dni" },    
                { label: "Teléfono", key: "telefono" },
                { 
                  label: "Vencimiento Licencia", 
                  key: "licencia",
                  render: (value) => <LicenseBadge date={value} />
                },
                { 
                  label: "Viajes Realizados", 
                  key: "_id",
                  render: (value, row) => {
                      const count = trips.filter(t => 
                          (t.tipoAsignacion === 'chofer' && t.asignadoId?.toString() === row._id.toString()) ||
                          (t.choferId && t.choferId.toString() === row._id.toString())
                      ).length;
                      return <span className="font-bold">{count}</span>;
                  }
                },
              ]}
              formFields={[
                { label: "Nombre", key: "nombre", required: true },
                { label: "DNI", key: "dni", required: true },
                { label: "Teléfono", key: "telefono" },
                {label: "Vencimiento Licencia", key: "licencia", type: "date" , required: true},
               
              ]}
            />
          ),
        },
     
      ]}
    />
  );
}
