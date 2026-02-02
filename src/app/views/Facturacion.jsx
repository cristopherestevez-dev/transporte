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
        const res = await fetch("/db.json", { cache: "no-store" });
        const data = await res.json();
        setFacturacion(data.facturacion || { cobranzas: { nacionales: [], internacionales: [] }, pagos: { nacionales: [], internacionales: [] } });
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-brand-navy">Facturación</h1>
        <p className="text-default-500 mt-1">Gestión de cobranzas, pagos y balance financiero</p>
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
