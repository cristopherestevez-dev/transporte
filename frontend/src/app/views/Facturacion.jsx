"use client";

import { useState, useEffect } from "react";
import { Tabs, Tab } from "@heroui/react";
import FacturacionTable from "@/app/components/ui/FacturacionTable/FacturacionTable";
import BalanceCard from "@/app/components/ui/BalanceCard/BalanceCard";
import TabsWrapper from "@/app/components/ui/TabsWrapper/TabsWrapper";
import { HiCash, HiTrendingUp, HiTrendingDown } from "react-icons/hi";
import api from "@/services/api";

export default function Facturacion() {
  const [facturacion, setFacturacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("balance");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cobranzasNac, cobranzasInt, pagosNac, pagosInt] = await Promise.all([
          api.getCobranzasNacionales(),
          api.getCobranzasInternacionales(),
          api.getPagosNacionales(),
          api.getPagosInternacionales()
        ]);

        // Procesar vencimientos
        const processExpirations = (items) => {
          if (!items) return [];
          const today = new Date();
          return items.map(item => {
            if (item.estado === "pagado" || item.estado === "cobrado") return item;
            
            const fechaEmision = new Date(item.fecha + "T00:00:00"); 
            const plazoDias = item.plazo || 30; 
            const fechaVencimiento = new Date(fechaEmision);
            fechaVencimiento.setDate(fechaEmision.getDate() + plazoDias);
            
            const todayMidnight = new Date();
            todayMidnight.setHours(0, 0, 0, 0);

            if (todayMidnight > fechaVencimiento && item.estado !== "vencido") {
              return { ...item, estado: "vencido" };
            }
            return item;
          });
        };

        const data = {
          cobranzas: {
            nacionales: processExpirations(cobranzasNac),
            internacionales: processExpirations(cobranzasInt)
          },
          pagos: {
            nacionales: processExpirations(pagosNac),
            internacionales: processExpirations(pagosInt)
          }
        };
        
        setFacturacion(data);

      } catch (error) {
        console.error("Error cargando facturación:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
          apiUrl="http://localhost:3001/api/facturacion/cobranzas/nacionales"
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
          apiUrl="http://localhost:3001/api/facturacion/cobranzas/internacionales"
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
          apiUrl="http://localhost:3001/api/facturacion/pagos/nacionales"
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
          apiUrl="http://localhost:3001/api/facturacion/pagos/internacionales"
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
