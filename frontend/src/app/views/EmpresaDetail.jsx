"use client";
import { ArrowLeft, Eye, Search, X } from "lucide-react";


import { useState, useEffect, useMemo } from "react";
import Link from "next/link";


import api from "@/services/api";
import SelectSearch from "../components/ui/SelectSearch/Select";
import Pagination, { PageSizeSelect } from '../components/ui/Pagination/Pagination';
import { amounts, summarize } from '@/lib/balance.mjs';
import FacturaAdjunto from '@/app/components/ui/FacturaAdjunto/FacturaAdjunto';
import ComprobanteOperacion from '@/app/components/ui/ComprobanteOperacion/ComprobanteOperacion';

import { useAuth } from "../contexts/AuthContext";

const PLAZO_OPTIONS = [15, 30, 45, 60, 90];

function getVencimientoBadge(fecha, plazo) {
  if (!fecha) return { label: "-", color: "bg-default-100 text-default-500" };

  const fechaEmision = new Date(fecha + "T00:00:00");
  const vencimiento = new Date(fechaEmision);
  vencimiento.setDate(fechaEmision.getDate() + (plazo || 30));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const timeDiff = vencimiento - today;
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  const fechaStr = vencimiento.toLocaleDateString("es-AR");

  if (daysDiff < 0) {
    return {
      label: fechaStr,
      color: "bg-red-500/15 text-red-500 border border-red-500/30",
      tooltip: "Vencida",
    };
  } else if (daysDiff <= 15) {
    return {
      label: fechaStr,
      color: "bg-yellow-500/15 text-yellow-500 border border-yellow-500/30",
      tooltip: `${daysDiff} días restantes`,
    };
  } else if (daysDiff <= 30) {
    return {
      label: fechaStr,
      color: "bg-blue-500/15 text-blue-500 border border-blue-500/30",
      tooltip: `${daysDiff} días restantes`,
    };
  } else {
    return {
      label: fechaStr,
      color: "bg-green-500/15 text-green-500 border border-green-500/30",
      tooltip: `${daysDiff} días restantes`,
    };
  }
}

export default function EmpresaDetail({ id, tipo = 'proveedor' }) {
  const { tienePermiso } = useAuth();
  const canViewBilling = tienePermiso("facturacion");
  const [empresa, setEmpresa] = useState(null);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch proveedor data
        const found = await api.get(`/${tipo === 'fletero' ? 'fleteros' : 'proveedores'}/${id}`);
        setEmpresa(found);

        if (found && canViewBilling) {
          // Fetch all facturacion data and filter by this empresa's razon_social/cuit
          const [cobranzasNac, cobranzasInt, pagosNac, pagosInt] =
            await Promise.all([
              api.getCobranzasNacionales(),
              api.getCobranzasInternacionales(),
              api.getPagosNacionales(),
              api.getPagosInternacionales(),
            ]);

          const allFacturas = [
            ...(cobranzasNac || []).map((f) => ({
              ...f,
              origen: "Cobranza Nacional",
              endpoint: "cobranzas/nacionales",
            })),
            ...(cobranzasInt || []).map((f) => ({
              ...f,
              origen: "Cobranza Internacional",
              endpoint: "cobranzas/internacionales",
            })),
            ...(pagosNac || []).map((f) => ({ ...f, origen: "Pago Nacional", endpoint: "pagos/nacionales" })),
            ...(pagosInt || []).map((f) => ({
              ...f,
              origen: "Pago Internacional",
              endpoint: "pagos/internacionales",
            })),
          ];

          // Filter by matching cuit OR razon_social
          const empresaCuit = (found.cuil_cuit || "").trim().toLowerCase();
          const empresaNombre = (found.nombre || "").trim().toLowerCase();

          const filtered = allFacturas.filter((f) => {
            const fCuit = (f.cuit || "").trim().toLowerCase();
            const fRazon = (f.razon_social || "").trim().toLowerCase();
            const normalizedCuit = value => value.replace(/\D/g, '');
            return empresaCuit && fCuit
              ? normalizedCuit(fCuit) === normalizedCuit(empresaCuit)
              : Boolean(empresaNombre && fRazon === empresaNombre);
          });

          setFacturas(filtered);
        }
      } catch (err) {
        setError(err.message);
        console.error("Error loading empresa detail:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, tipo, canViewBilling]);

  // Handle plazo change locally
  const handlePlazoChange = async (facturaId, newPlazo) => {
    const item = facturas.find(f => (f._id || f.id) === facturaId);
    try {
      const saved = await api.patch(`/facturacion/${item.endpoint}/${facturaId}`, { plazo: Number(newPlazo) });
      setFacturas(prev => prev.map(f => (f._id || f.id) === facturaId ? { ...f, ...saved } : f));
    } catch (error) { alert("No se pudo guardar el plazo: " + error.message); }
  };

  // View factura PDF
  const viewFactura = (item) => {
    if (item.orden_pago_url) {
      window.open(item.orden_pago_url, "_blank");
    } else {
      alert("No hay PDF disponible para esta factura.");
    }
  };

  // Search filter
  const filteredFacturas = useMemo(() => {
    if (!searchTerm.trim()) return facturas;
    const term = searchTerm.toLowerCase();
    return facturas.filter(
      (f) =>
        (f.numero_comprobante || "").toLowerCase().includes(term) ||
        (f.fecha || "").includes(term) ||
        (f.tipo_comprobante || "").toLowerCase().includes(term) ||
        (f.transportista || "").toLowerCase().includes(term) ||
        (f.origen || "").toLowerCase().includes(term),
    );
  }, [facturas, searchTerm]);

  const balances = useMemo(() => {
    const groups = {};
    for (const row of facturas) {
      if (row.tipo_comprobante === 'recibo') continue;
      const moneda = row.moneda || 'Sin definir';
      (groups[moneda] ||= []).push({ ...row, direction: row.endpoint.startsWith('cobranzas') ? 'emitida' : 'recibida' });
    }
    return Object.entries(groups).map(([moneda, rows]) => ({ moneda, ...summarize(rows) }));
  }, [facturas]);
  const shownFacturas = filteredFacturas.slice((page - 1) * pageSize, page * pageSize);
  const pageControls = { page, pageSize, total: filteredFacturas.length, totalPages: Math.ceil(filteredFacturas.length / pageSize), onPageChange: setPage, onPageSizeChange: value => { setPageSize(value); setPage(1); } };
  const money = (cents, moneda) => ['ARS', 'USD', 'CLP'].includes(moneda) ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda }).format(cents / 100) : new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(cents / 100) + ' (moneda sin definir)';
  useEffect(() => { setPage(1); }, [searchTerm, id, tipo]);
  useEffect(() => { setPage(current => Math.min(current, Math.max(1, Math.ceil(filteredFacturas.length / pageSize)))); }, [filteredFacturas.length, pageSize]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) return <div className="p-6"><p role="alert" className="text-danger">{error}</p><Link href="/empresas" className="text-primary">Volver a Empresas</Link></div>;
  if (!empresa) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <p className="text-lg text-foreground/60">Empresa no encontrada</p>
        <Link href="/empresas" className="text-primary hover:underline">
          Volver a Empresas
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-divider">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/empresas"
              className="p-2 -ml-2 rounded-full hover:bg-content2 transition-colors"
            >
              <ArrowLeft className="text-foreground/70" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                {empresa.nombre}
                <span className="px-2 py-0.5 rounded text-xs font-mono bg-content2 border border-divider">
                  {empresa.cuil_cuit}
                </span>
              </h1>
              <p className="text-xs text-foreground/50">
                {tipo === 'fletero' ? 'Fletero · Facturas y balance' : 'Proveedor · Facturas y balance'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {!canViewBilling && <p className="text-default-500">Tu perfil no tiene permiso para consultar facturación.</p>}
        {canViewBilling && balances.map(balance => <section key={balance.moneda} className="mb-6 p-4 rounded-xl border border-divider bg-content1"><h2 className="font-semibold mb-3">Balance · {balance.moneda}</h2><dl className="grid grid-cols-2 md:grid-cols-4 gap-4">{[['emitted', 'Facturado emitido'], ['received', 'Facturado recibido'], ['collected', 'Cobrado'], ['paid', 'Pagado'], ['receivable', 'Pendiente de cobrar'], ['payable', 'Pendiente de pagar'], ['balance', 'Balance de facturación'], ['pending', 'Saldo pendiente neto']].map(([key, label]) => <div key={key}><dt className="text-xs text-default-500">{label}</dt><dd className={`font-semibold mt-1 ${balance[key] < 0 ? 'text-danger' : 'text-foreground'}`}>{money(balance[key], balance.moneda)}</dd></div>)}</dl></section>)}
        {/* Search bar */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-default-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar por número, fecha, detalle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-divider rounded-lg bg-content1 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="flex items-center gap-1 text-foreground/60 hover:text-danger text-sm"
            >
              <X size={16} /> Limpiar
            </button>
          )}
          <span className="text-sm text-foreground/50 ml-auto">
            {filteredFacturas.length} registro(s)
          </span>
          <PageSizeSelect {...pageControls} />
        </div>

        {/* Table */}
        <div className="bg-content1 rounded-xl border border-divider shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-brand-navy">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Nº Factura
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Detalle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Realizó Viaje
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                    Días Venc.
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                    Fecha Venc.
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                    Acciones
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase">Pagado / Cobrado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase">Saldo pendiente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase">Comprobante de cobro / pago</th>
                </tr>
              </thead>
              <tbody>
                {filteredFacturas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-4 py-12 text-center text-foreground/50"
                    >
                      No se encontraron facturas para esta empresa.
                    </td>
                  </tr>
                ) : (
                  shownFacturas.map((item) => {
                    const plazo = item.plazo || 30;
                    const badge = getVencimientoBadge(item.fecha, plazo);

                    return (
                      <tr
                        key={`${item.endpoint}/${item._id || item.id}`}
                        className="bg-content1 hover:bg-content2 transition-colors border-b border-divider"
                      >
                        {/* Fecha */}
                        <td className="px-4 py-3 text-sm text-foreground">
                          {item.fecha || "-"}
                        </td>

                        {/* Número de factura */}
                        <td className="px-4 py-3 text-sm text-foreground font-mono">
                          {item.numero_comprobante || "-"}
                        </td>

                        {/* Detalle */}
                        <td className="px-4 py-3 text-sm text-foreground">
                          <div className="flex flex-col">
                            <span>
                              {item.tipo_comprobante
                                ? getTipoLabel(item.tipo_comprobante)
                                : "-"}
                            </span>
                            <span className="text-[10px] text-foreground/40">
                              {item.origen}
                            </span>
                          </div>
                        </td>

                        {/* Realizó el viaje */}
                        <td className="px-4 py-3 text-sm text-foreground">
                          {item.transportista || "-"}
                        </td>

                        {/* Días de vencimiento (select) */}
                        <td className="px-4 py-3 text-center flex justify-center">
                          {(() => {
                            const options = PLAZO_OPTIONS.map((d) => ({
                              label: `${d} días`,
                              value: d,
                            }));
                            const selectedOption = options.find((opt) => opt.value === plazo);
                            return (
                              <SelectSearch
                                options={options}
                                selectedOption={selectedOption}
                                onOptionChange={(opt) =>
                                  handlePlazoChange(item._id || item.id, opt.value)
                                }
                                className="h-8 border-divider"
                                width="110px"
                              />
                            );
                          })()}
                        </td>

                        {/* Fecha de vencimiento (pastilla color) */}
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${badge.color}`}
                            title={badge.tooltip}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* Monto */}
                        <td className="px-4 py-3 text-sm text-foreground text-right font-mono font-medium">
                          {money(amounts(item).total, item.moneda || 'Sin definir')}
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3 text-center">
                          <FacturaAdjunto item={item} onChange={archivoFactura => setFacturas(previous => previous.map(row => row._id === item._id && row.endpoint === item.endpoint ? { ...row, archivoFactura } : row))} />
                          {item.orden_pago_url && <button
                            onClick={() => viewFactura(item)}
                            className="p-2 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Ver factura"
                          >
                            <Eye size={16} />
                          </button>}
                        </td>
                        <td className="px-4 py-3 text-sm text-right whitespace-nowrap">{money(amounts(item).paid, item.moneda || 'Sin definir')}</td>
                        <td className="px-4 py-3 text-sm text-right whitespace-nowrap">{money(amounts(item).pending, item.moneda || 'Sin definir')}</td>
                        <td className="px-4 py-3 text-sm"><ComprobanteOperacion item={item} onChange={saved => setFacturas(previous => previous.map(row => row._id === item._id && row.endpoint === item.endpoint ? { ...row, ...saved } : row))} /></td>
                        <td className="px-4 py-3"><FacturaAdjunto tipo="comprobante" item={item} onChange={archivoPago => setFacturas(previous => previous.map(row => row._id === item._id && row.endpoint === item.endpoint ? { ...row, archivoPago } : row))} /></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 border-t border-divider"><Pagination {...pageControls} /></div>
        </div>
      </div>
    </div>
  );
}

// Helper to get readable label for tipo_comprobante
function getTipoLabel(tipo) {
  const map = {
    factura_a: "Factura A",
    factura_b: "Factura B",
    factura_c: "Factura C",
    nota_credito: "Nota de Crédito",
    nota_debito: "Nota de Débito",
    recibo: "Recibo",
  };
  return map[tipo] || tipo || "-";
}
