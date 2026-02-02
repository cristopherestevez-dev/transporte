"use client";

import { useMemo } from "react";
import { HiTrendingUp, HiTrendingDown, HiCash, HiClock, HiExclamationCircle, HiCheckCircle } from "react-icons/hi";

export default function BalanceCard({ cobranzas = { nacionales: [], internacionales: [] }, pagos = { nacionales: [], internacionales: [] } }) {
  
  // Calcular totales por estado para cobranzas
  const cobranzasTotals = useMemo(() => {
    const all = [...(cobranzas.nacionales || []), ...(cobranzas.internacionales || [])];
    return {
      cobrado: all.filter(i => i.estado === "cobrado").reduce((acc, i) => acc + i.monto, 0),
      pendiente: all.filter(i => i.estado === "pendiente").reduce((acc, i) => acc + i.monto, 0),
      vencido: all.filter(i => i.estado === "vencido").reduce((acc, i) => acc + i.monto, 0),
      total: all.reduce((acc, i) => acc + i.monto, 0),
    };
  }, [cobranzas]);

  // Calcular totales por estado para pagos
  const pagosTotals = useMemo(() => {
    const all = [...(pagos.nacionales || []), ...(pagos.internacionales || [])];
    return {
      pagado: all.filter(i => i.estado === "pagado").reduce((acc, i) => acc + i.monto, 0),
      pendiente: all.filter(i => i.estado === "pendiente").reduce((acc, i) => acc + i.monto, 0),
      vencido: all.filter(i => i.estado === "vencido").reduce((acc, i) => acc + i.monto, 0),
      total: all.reduce((acc, i) => acc + i.monto, 0),
    };
  }, [pagos]);

  // Balance neto
  const balanceNeto = useMemo(() => {
    return cobranzasTotals.cobrado - pagosTotals.pagado;
  }, [cobranzasTotals, pagosTotals]);

  // Por cobrar vs por pagar (pendiente + vencido)
  const porCobrar = cobranzasTotals.pendiente + cobranzasTotals.vencido;
  const porPagar = pagosTotals.pendiente + pagosTotals.vencido;

  const isPositiveBalance = balanceNeto >= 0;

  return (
    <div className="space-y-6">
      {/* Balance Principal */}
      <div className="bg-content1 rounded-xl shadow-lg border border-divider p-6">
        <h2 className="text-xl font-bold text-brand-navy mb-6 flex items-center gap-2">
          <HiCash className="text-secondary" size={24} />
          Balance General
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Balance Neto */}
          <div className={`rounded-xl p-6 text-center ${isPositiveBalance ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500' : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500'}`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              {isPositiveBalance ? (
                <HiTrendingUp className="text-green-500" size={28} />
              ) : (
                <HiTrendingDown className="text-red-500" size={28} />
              )}
              <span className="text-sm font-medium text-default-500">Balance Neto</span>
            </div>
            <p className={`text-3xl font-bold ${isPositiveBalance ? 'text-green-600' : 'text-red-600'}`}>
              ${balanceNeto.toLocaleString()}
            </p>
            <p className="text-xs text-default-400 mt-1">
              (Cobrado - Pagado)
            </p>
          </div>

          {/* Por Cobrar */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-center border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-center gap-2 mb-2">
              <HiTrendingUp className="text-blue-500" size={24} />
              <span className="text-sm font-medium text-default-500">Por Cobrar</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">${porCobrar.toLocaleString()}</p>
            <p className="text-xs text-default-400 mt-1">Pendiente + Vencido</p>
          </div>

          {/* Por Pagar */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 text-center border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-center gap-2 mb-2">
              <HiTrendingDown className="text-orange-500" size={24} />
              <span className="text-sm font-medium text-default-500">Por Pagar</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">${porPagar.toLocaleString()}</p>
            <p className="text-xs text-default-400 mt-1">Pendiente + Vencido</p>
          </div>
        </div>
      </div>

      {/* Detalle Cobranzas y Pagos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resumen Cobranzas */}
        <div className="bg-content1 rounded-xl shadow border border-divider p-6">
          <h3 className="text-lg font-bold text-brand-navy mb-4">Cobranzas</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <HiCheckCircle className="text-green-500" size={20} />
                <span className="text-sm text-foreground">Cobrado</span>
              </div>
              <span className="font-bold text-green-600">${cobranzasTotals.cobrado.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <HiClock className="text-yellow-500" size={20} />
                <span className="text-sm text-foreground">Pendiente</span>
              </div>
              <span className="font-bold text-yellow-600">${cobranzasTotals.pendiente.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <HiExclamationCircle className="text-red-500" size={20} />
                <span className="text-sm text-foreground">Vencido</span>
              </div>
              <span className="font-bold text-red-600">${cobranzasTotals.vencido.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-content2 rounded-lg border-t-2 border-brand-navy">
              <span className="text-sm font-bold text-foreground">Total Facturado</span>
              <span className="font-bold text-brand-navy">${cobranzasTotals.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Resumen Pagos */}
        <div className="bg-content1 rounded-xl shadow border border-divider p-6">
          <h3 className="text-lg font-bold text-brand-navy mb-4">Pagos</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <HiCheckCircle className="text-green-500" size={20} />
                <span className="text-sm text-foreground">Pagado</span>
              </div>
              <span className="font-bold text-green-600">${pagosTotals.pagado.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <HiClock className="text-yellow-500" size={20} />
                <span className="text-sm text-foreground">Pendiente</span>
              </div>
              <span className="font-bold text-yellow-600">${pagosTotals.pendiente.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <HiExclamationCircle className="text-red-500" size={20} />
                <span className="text-sm text-foreground">Vencido</span>
              </div>
              <span className="font-bold text-red-600">${pagosTotals.vencido.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-content2 rounded-lg border-t-2 border-brand-navy">
              <span className="text-sm font-bold text-foreground">Total Pagos</span>
              <span className="font-bold text-brand-navy">${pagosTotals.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
