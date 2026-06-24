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

  const [dolarRate, setDolarRate] = useState(1100);
  const [clpRate, setClpRate] = useState(1.2);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedDolar = localStorage.getItem("cotizacionDolar");
    const savedClp = localStorage.getItem("cotizacionPesoChileno");
    if (savedDolar) setDolarRate(parseFloat(savedDolar));
    if (savedClp) setClpRate(parseFloat(savedClp));
  }, []);

  const handleSaveCotizaciones = () => {
    localStorage.setItem("cotizacionDolar", dolarRate.toString());
    localStorage.setItem("cotizacionPesoChileno", clpRate.toString());
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

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
    <div className="p-6 space-y-6">
      {/* Cotizaciones Panel */}
      <div className="bg-content1 border border-divider rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Cotizaciones de Monedas</h2>
          <p className="text-xs text-default-500 mt-1">
            Definí las cotizaciones en pesos argentinos (ARS) para convertir las tarifas en USD y los viáticos en pesos chilenos (CLP).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground/80">1 USD =</span>
            <input
              type="number"
              value={dolarRate}
              onChange={(e) => setDolarRate(parseFloat(e.target.value) || 0)}
              className="w-24 px-3 py-1.5 border border-divider rounded-lg bg-content2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-right font-medium"
            />
            <span className="text-sm text-default-500">ARS</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground/80">1 CLP =</span>
            <input
              type="number"
              step="0.001"
              value={clpRate}
              onChange={(e) => setClpRate(parseFloat(e.target.value) || 0)}
              className="w-24 px-3 py-1.5 border border-divider rounded-lg bg-content2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-right font-medium"
            />
            <span className="text-sm text-default-500">ARS</span>
          </div>

          <button
            onClick={handleSaveCotizaciones}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/80 transition-colors shadow-sm text-sm"
          >
            Guardar Cotizaciones
          </button>

          {saved && (
            <span className="text-success text-xs font-semibold animate-pulse">
              ¡Guardado!
            </span>
          )}
        </div>
      </div>

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
    </div>
  );
}
