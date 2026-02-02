"use client";

import { useState, useEffect } from "react";
import { Tabs, Tab } from "@heroui/react";
import FacturacionTable from "@/app/components/ui/FacturacionTable/FacturacionTable";
import BalanceCard from "@/app/components/ui/BalanceCard/BalanceCard";
import TabsWrapper from "@/app/components/ui/TabsWrapper/TabsWrapper";
import { HiCash, HiTrendingUp, HiTrendingDown } from "react-icons/hi";

export default function Facturacion() {
  const [facturacion, setFacturacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("balance");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Intentar cargar desde localStorage primero
        let data = null;
        const savedData = localStorage.getItem("facturacion_data");
        
        if (savedData) {
          data = JSON.parse(savedData);
        } else {
          const res = await fetch("/db.json", { cache: "no-store" });
          const dbData = await res.json();
          data = dbData.facturacion || { cobranzas: { nacionales: [], internacionales: [] }, pagos: { nacionales: [], internacionales: [] } };
        }

        // Procesar vencimientos
        const processExpirations = (items) => {
          if (!items) return [];
          const today = new Date();
          return items.map(item => {
            if (item.estado === "pagado" || item.estado === "cobrado") return item;
            
          // Calcular fecha de vencimiento
            const fechaEmision = new Date(item.fecha + "T00:00:00"); 
            const plazoDias = item.plazo || 30; 
            const fechaVencimiento = new Date(fechaEmision);
            fechaVencimiento.setDate(fechaEmision.getDate() + plazoDias);
            
            // Normalizar hoy a medianoche para comparar solo fechas
            const todayMidnight = new Date();
            todayMidnight.setHours(0, 0, 0, 0);

            // Si hoy es mayor a la fecha de vencimiento, marcar como vencido
            if (todayMidnight > fechaVencimiento && item.estado !== "vencido") {
              return { ...item, estado: "vencido" };
            }
            return item;
          });
        };

        // Aplicar lógica de vencimientos a todas las listas
        if (data) {
          const processedData = {
            cobranzas: {
              nacionales: processExpirations(data.cobranzas?.nacionales),
              internacionales: processExpirations(data.cobranzas?.internacionales)
            },
            pagos: {
              nacionales: processExpirations(data.pagos?.nacionales),
              internacionales: processExpirations(data.pagos?.internacionales)
            }
          };
          
          setFacturacion(processedData);
          localStorage.setItem("facturacion_data", JSON.stringify(processedData));
        }

      } catch (error) {
        console.error("Error cargando facturación:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sincronizar cambios a localStorage
  useEffect(() => {
    if (facturacion) {
      localStorage.setItem("facturacion_data", JSON.stringify(facturacion));
    }
  }, [facturacion]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-default-500">Cargando...</div>
      </div>
    );
  }

  // Tabs para Cobranzas Nacionales/Internacionales
  const cobranzasTabs = [
    {
      label: "Nacionales",
      content: (
        <FacturacionTable
          data={facturacion?.cobranzas?.nacionales || []}
          setData={(newData) => setFacturacion(prev => ({
            ...prev,
            cobranzas: { ...prev.cobranzas, nacionales: newData }
          }))}
          title="Cobranzas Nacionales"
          tipo="cobranzas"
        />
      )
    },
    {
      label: "Internacionales",
      content: (
        <FacturacionTable
          data={facturacion?.cobranzas?.internacionales || []}
          setData={(newData) => setFacturacion(prev => ({
            ...prev,
            cobranzas: { ...prev.cobranzas, internacionales: newData }
          }))}
          title="Cobranzas Internacionales"
          tipo="cobranzas"
        />
      )
    }
  ];

  // Tabs para Pagos Nacionales/Internacionales
  const pagosTabs = [
    {
      label: "Nacionales",
      content: (
        <FacturacionTable
          data={facturacion?.pagos?.nacionales || []}
          setData={(newData) => setFacturacion(prev => ({
            ...prev,
            pagos: { ...prev.pagos, nacionales: newData }
          }))}
          title="Pagos Nacionales"
          tipo="pagos"
        />
      )
    },
    {
      label: "Internacionales",
      content: (
        <FacturacionTable
          data={facturacion?.pagos?.internacionales || []}
          setData={(newData) => setFacturacion(prev => ({
            ...prev,
            pagos: { ...prev.pagos, internacionales: newData }
          }))}
          title="Pagos Internacionales"
          tipo="pagos"
        />
      )
    }
  ];

  return (
    <div className="p-6 bg-background min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Facturación</h1>
          <p className="text-default-500 mt-1">Gestión de cobranzas, pagos y balance financiero</p>
        </div>
        <button
          onClick={() => {
            if (confirm("¿Estás seguro de que querés reiniciar todos los datos? Se perderá el historial de pagos actual.")) {
              localStorage.removeItem("facturacion_data");
              window.location.reload();
            }
          }}
          className="px-4 py-2 bg-default-100 hover:bg-default-200 text-default-600 rounded-lg text-sm font-medium transition-colors"
        >
          Reiniciar Datos
        </button>
      </div>

      {/* Main Tabs */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={setActiveTab}
        color="secondary"
        variant="underlined"
        classNames={{
          tabList: "gap-6 w-full border-b border-divider pb-0",
          cursor: "bg-secondary",
          tab: "px-0 h-12",
          tabContent: "group-data-[selected=true]:text-secondary font-semibold",
        }}
      >
        {/* Balance Tab */}
        <Tab
          key="balance"
          title={
            <div className="flex items-center gap-2">
              <HiCash size={20} />
              <span>Balance</span>
            </div>
          }
        >
          <div className="pt-6">
            <BalanceCard
              cobranzas={facturacion?.cobranzas}
              pagos={facturacion?.pagos}
            />
          </div>
        </Tab>

        {/* Cobranzas Tab */}
        <Tab
          key="cobranzas"
          title={
            <div className="flex items-center gap-2">
              <HiTrendingUp size={20} />
              <span>Cobranzas</span>
            </div>
          }
        >
          <div className="pt-6">
            <TabsWrapper tabs={cobranzasTabs} />
          </div>
        </Tab>

        {/* Pagos Tab */}
        <Tab
          key="pagos"
          title={
            <div className="flex items-center gap-2">
              <HiTrendingDown size={20} />
              <span>Pagos</span>
            </div>
          }
        >
          <div className="pt-6">
            <TabsWrapper tabs={pagosTabs} />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
