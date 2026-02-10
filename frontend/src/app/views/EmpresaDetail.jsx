"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { FaArrowLeft, FaEye } from "react-icons/fa";
import { HiSearch, HiX } from "react-icons/hi";
import api from "@/services/api";

const PLAZO_OPTIONS = [15, 30, 45, 60, 90];

function getVencimientoBadge(fecha, plazo) {
  if (!fecha) return { label: "-", color: "bg-gray-200 text-gray-600" };

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
      color: "bg-red-100 text-red-700 border border-red-300",
      tooltip: "Vencida",
    };
  } else if (daysDiff <= 15) {
    return {
      label: fechaStr,
      color: "bg-yellow-100 text-yellow-700 border border-yellow-300",
      tooltip: `${daysDiff} días restantes`,
    };
  } else if (daysDiff <= 30) {
    return {
      label: fechaStr,
      color: "bg-blue-100 text-blue-700 border border-blue-300",
      tooltip: `${daysDiff} días restantes`,
    };
  } else {
    return {
      label: fechaStr,
      color: "bg-green-100 text-green-700 border border-green-300",
      tooltip: `${daysDiff} días restantes`,
    };
  }
}

export default function EmpresaDetail({ id }) {
  const [empresa, setEmpresa] = useState(null);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch proveedor data
        const proveedores = await api.getProveedores();
        const found = proveedores.find((p) => (p._id || p.id) === id);
        setEmpresa(found);

        if (found) {
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
            })),
            ...(cobranzasInt || []).map((f) => ({
              ...f,
              origen: "Cobranza Internacional",
            })),
            ...(pagosNac || []).map((f) => ({ ...f, origen: "Pago Nacional" })),
            ...(pagosInt || []).map((f) => ({
              ...f,
              origen: "Pago Internacional",
            })),
          ];

          // Filter by matching cuit OR razon_social
          const empresaCuit = (found.cuil_cuit || "").trim().toLowerCase();
          const empresaNombre = (found.nombre || "").trim().toLowerCase();

          const filtered = allFacturas.filter((f) => {
            const fCuit = (f.cuit || "").trim().toLowerCase();
            const fRazon = (f.razon_social || "").trim().toLowerCase();
            return (
              (empresaCuit && fCuit === empresaCuit) ||
              (empresaNombre && fRazon === empresaNombre)
            );
          });

          setFacturas(filtered);
        }
      } catch (err) {
        console.error("Error loading empresa detail:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // Handle plazo change locally
  const handlePlazoChange = (facturaId, newPlazo) => {
    setFacturas((prev) =>
      prev.map((f) =>
        (f._id || f.id) === facturaId ? { ...f, plazo: Number(newPlazo) } : f,
      ),
    );
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

  // Grand total
  const total = useMemo(() => {
    return filteredFacturas.reduce((acc, f) => acc + (f.monto || 0), 0);
  }, [filteredFacturas]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
              <FaArrowLeft className="text-foreground/70" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                {empresa.nombre}
                <span className="px-2 py-0.5 rounded text-xs font-mono bg-content2 border border-divider">
                  {empresa.cuil_cuit}
                </span>
              </h1>
              <p className="text-xs text-foreground/50">
                Historial de Facturación
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase font-bold text-foreground/40">
                Total Facturado
              </p>
              <p className="text-xl font-bold text-primary">
                ${total.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Search bar */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <HiSearch
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
              <HiX size={16} /> Limpiar
            </button>
          )}
          <span className="text-sm text-foreground/50 ml-auto">
            {filteredFacturas.length} registro(s)
          </span>
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
                </tr>
              </thead>
              <tbody>
                {filteredFacturas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-foreground/50"
                    >
                      No se encontraron facturas para esta empresa.
                    </td>
                  </tr>
                ) : (
                  filteredFacturas.map((item) => {
                    const plazo = item.plazo || 30;
                    const badge = getVencimientoBadge(item.fecha, plazo);

                    return (
                      <tr
                        key={item._id || item.id}
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
                        <td className="px-4 py-3 text-center">
                          <select
                            value={plazo}
                            onChange={(e) =>
                              handlePlazoChange(
                                item._id || item.id,
                                e.target.value,
                              )
                            }
                            className="px-2 py-1 rounded-lg text-xs border border-divider bg-content2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                          >
                            {PLAZO_OPTIONS.map((d) => (
                              <option key={d} value={d}>
                                {d} días
                              </option>
                            ))}
                          </select>
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
                          ${(item.monto || 0).toLocaleString()}
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => viewFactura(item)}
                            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver factura"
                          >
                            <FaEye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Total */}
          <div className="px-4 py-4 bg-content2 border-t border-divider flex justify-end items-center gap-4">
            <span className="text-sm font-medium text-foreground/50">
              Total:
            </span>
            <span className="text-xl font-bold text-primary">
              ${total.toLocaleString()}
            </span>
          </div>
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
