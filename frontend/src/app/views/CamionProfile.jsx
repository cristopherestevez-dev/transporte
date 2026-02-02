"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FaArrowLeft, FaPlus, FaTrash, FaSave } from "react-icons/fa";
import api from "@/services/api";

// Helper for standard 4-column filters (Cambio, Marca, Codigo, Precio)
const renderStandardGroup = (row, index, prefix, handleChange) => (
  <>
    <td className="border px-2 py-1 text-center">
      <input
        type="checkbox"
        checked={row[prefix + "_cambio"] || false}
        onChange={(e) => handleChange(index, prefix + "_cambio", e.target.checked)}
      />
    </td>
    <td className="border px-2 py-1">
      <input
        className="w-full text-xs bg-transparent focus:bg-white focus:outline-none p-1"
        value={row[prefix + "_marca"] || ""}
        onChange={(e) => handleChange(index, prefix + "_marca", e.target.value)}
      />
    </td>
    <td className="border px-2 py-1">
      <input
        className="w-full text-xs bg-transparent focus:bg-white focus:outline-none p-1"
        value={row[prefix + "_codigo"] || ""}
        onChange={(e) => handleChange(index, prefix + "_codigo", e.target.value)}
      />
    </td>
    <td className="border border-divider px-2 py-1">
      <input
        type="number"
        className="w-full text-xs bg-transparent focus:bg-content2 text-foreground focus:outline-none p-1"
        value={row[prefix + "_precio"] || ""}
        onChange={(e) => handleChange(index, prefix + "_precio", e.target.value)}
      />
    </td>
  </>
);

export default function CamionProfile({ id }) {
  const [truck, setTruck] = useState(null);
  const [maintenanceLog, setMaintenanceLog] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load Truck Data
  useEffect(() => {
    async function fetchTruck() {
      try {
        setLoading(true);
        // Fetch from API
        const [camiones, semirremolques] = await Promise.all([
          api.getCamiones(),
          api.getSemirremolques()
        ]);
        // Check both camiones and semirremolques incase
        const found = camiones.find((c) => c._id.toString() === id.toString()) || 
                      semirremolques?.find((c) => c._id.toString() === id.toString());
        setTruck(found);
      } catch (err) {
        console.error("Error loading truck:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTruck();
  }, [id]);

  // Load Maintenance Log from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem(`maintenance_log_${id}`);
    if (stored) {
      setMaintenanceLog(JSON.parse(stored));
    }
  }, [id]);

  const saveLog = (newLog) => {
    setMaintenanceLog(newLog);
    localStorage.setItem(`maintenance_log_${id}`, JSON.stringify(newLog));
  };

  const addRow = () => {
    const newRow = {
      id: Date.now(),
      fecha: new Date().toISOString().split("T")[0],
      patente: truck?.patente || "",
    };
    saveLog([...maintenanceLog, newRow]);
  };

  const removeRow = (rowId) => {
    const newLog = maintenanceLog.filter((r) => r.id !== rowId);
    saveLog(newLog);
  };

  const handleChange = (index, field, value) => {
    const newLog = [...maintenanceLog];
    newLog[index][field] = value;
    saveLog(newLog);
  };

  // Calculate Totals
  const calculateTotal = (row) => {
    let total = 0;
    
    // Aceite
    const aceitePrice = parseFloat(row.aceite_precioxl) || 0;
    const aceiteLitros = parseFloat(row.aceite_litros) || 0;
    const aceiteTotal = aceitePrice * aceiteLitros;
    total += aceiteTotal;

    // Cubiertas
    const cubiertasPrice = parseFloat(row.cubiertas_precio_unit) || 0;
    const cubiertasQty = parseFloat(row.cubiertas_cantidad) || 0;
    const cubiertasTotal = cubiertasPrice * cubiertasQty;
    total += cubiertasTotal;

    // Filters & Parts (Simple Price addition)
    const prefixes = [
      "filtro_aceite", "filtro_gasoil", "trampa_agua", "secado_aire", 
      "filtro_aire", "filtro_habitaculo", "bomba_agua", "valvulas", 
      "toberas", "extras"
    ];

    prefixes.forEach(p => {
      total += parseFloat(row[p + "_precio"]) || 0;
    });

    return total;
  };

  const grandTotal = maintenanceLog.reduce((acc, row) => acc + calculateTotal(row), 0);
  const grandTotalIVA = grandTotal * 1.21; // Assuming 21% IVA

  if (loading) return <div className="p-8">Cargando...</div>;
  if (!truck) return <div className="p-8">Camión no encontrado</div>;

  return (
    <div className="p-6 bg-background min-h-screen transition-colors duration-300">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/camiones" className="p-2 bg-content1 rounded shadow hover:bg-content2 text-foreground">
          <FaArrowLeft />
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          Planilla de Mantenimiento: {truck.marca} {truck.modelo} ({truck.patente})
        </h1>
      </div>

      <div className="bg-content1 shadow rounded-lg overflow-hidden flex flex-col border border-divider">
        <div className="overflow-x-auto pb-4">
          <table className="min-w-[3000px] border-collapse bg-content1 text-sm text-foreground">
            <thead className="bg-brand-navy text-white uppercase font-semibold">
              <tr>
                <th rowSpan={2} className="border border-divider px-2 py-1 sticky left-0 bg-brand-navy z-10 w-24">Fecha</th>
                <th rowSpan={2} className="border border-divider px-2 py-1 w-24">Patente</th>
                <th rowSpan={2} className="border border-divider px-2 py-1 w-20">Km</th>

                <th colSpan={6} className="border border-divider px-2 py-1 text-center bg-brand-navy/90 text-white">Aceite</th>
                <th colSpan={4} className="border border-divider px-2 py-1 text-center bg-brand-navy/80 text-white">Filtro Aceite</th>
                <th colSpan={5} className="border border-divider px-2 py-1 text-center bg-brand-navy/90 text-white">Cubiertas</th>
                <th colSpan={4} className="border border-divider px-2 py-1 text-center bg-brand-navy/80 text-white">Filtro Gasoil</th>
                <th colSpan={4} className="border border-divider px-2 py-1 text-center bg-brand-navy/90 text-white">Trampa de Agua</th>
                <th colSpan={4} className="border border-divider px-2 py-1 text-center bg-brand-navy/80 text-white">Secado de Aire</th>
                <th colSpan={4} className="border border-divider px-2 py-1 text-center bg-brand-navy/90 text-white">Filtro de Aire</th>
                <th colSpan={4} className="border border-divider px-2 py-1 text-center bg-brand-navy/80 text-white">Filtro Habitaculo</th>
                <th colSpan={4} className="border border-divider px-2 py-1 text-center bg-brand-navy/90 text-white">Bomba de Agua</th>
                <th colSpan={4} className="border border-divider px-2 py-1 text-center bg-brand-navy/80 text-white">Valvulas</th>
                <th colSpan={4} className="border border-divider px-2 py-1 text-center bg-brand-navy/90 text-white">Toberas</th>
                <th colSpan={2} className="border border-divider px-2 py-1 text-center bg-brand-navy/80 text-white">Extras</th>
                <th rowSpan={2} className="border px-2 py-1 w-10"></th>
              </tr>
              <tr>
                {/* Aceite Headers */}
                <th className="border px-2 py-1 text-[10px]">Cambio</th>
                <th className="border px-2 py-1 text-[10px]">Marca</th>
                <th className="border px-2 py-1 text-[10px]">Codigo</th>
                <th className="border px-2 py-1 text-[10px]">Precio x L</th>
                <th className="border px-2 py-1 text-[10px]">Litros</th>
                <th className="border px-2 py-1 text-[10px]">Total</th>

                {/* Standard Headers (Filtro Aceite) */}
                <th className="border px-2 py-1 text-[10px]">Cambio</th>
                <th className="border px-2 py-1 text-[10px]">Marca</th>
                <th className="border px-2 py-1 text-[10px]">Codigo</th>
                <th className="border px-2 py-1 text-[10px]">Precio</th>

                {/* Cubiertas Headers */}
                <th className="border px-2 py-1 text-[10px]">Cambio</th>
                <th className="border px-2 py-1 text-[10px]">Cantidad</th>
                <th className="border px-2 py-1 text-[10px]">Marca</th>
                <th className="border px-2 py-1 text-[10px]">Precio Unit</th>
                <th className="border px-2 py-1 text-[10px]">Total</th>

                {/* Standard Headers Repetition */}
                {Array(7).fill(null).map((_, i) => (
                  <React.Fragment key={i}>
                    <th className="border px-2 py-1 text-[10px]">Cambio</th>
                    <th className="border px-2 py-1 text-[10px]">Marca</th>
                    <th className="border px-2 py-1 text-[10px]">{i === 5 ? "Regular" : "Codigo"}</th>
                    <th className="border px-2 py-1 text-[10px]">Precio</th>
                  </React.Fragment>
                ))}

                {/* Extras Headers */}
                <th className="border px-2 py-1 text-[10px]">Descripcion</th>
                <th className="border border-divider px-2 py-1 text-[10px]">Precio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {maintenanceLog.map((row, index) => (
                <tr key={row.id}>
                  {/* General */}
                  <td className="border border-divider px-2 py-1 sticky left-0 bg-content1 z-10">
                    <input 
                      type="date" 
                      className="w-full text-xs bg-transparent outline-none"
                      value={row.fecha}
                      onChange={(e) => handleChange(index, 'fecha', e.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input 
                      className="w-full text-xs bg-transparent outline-none"
                      defaultValue={row.patente}
                      readOnly
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input 
                      type="number"
                      className="w-full text-xs bg-transparent outline-none"
                      value={row.km || ""}
                      onChange={(e) => handleChange(index, 'km', e.target.value)}
                      placeholder="KM"
                    />
                  </td>

                  {/* Aceite */}
                  <td className="border px-2 py-1 text-center">
                    <input type="checkbox" checked={row.aceite_cambio || false} onChange={e => handleChange(index, 'aceite_cambio', e.target.checked)} />
                  </td>
                  <td className="border px-2 py-1"><input className="w-full text-xs outline-none" value={row.aceite_marca || ""} onChange={e => handleChange(index, 'aceite_marca', e.target.value)} /></td>
                  <td className="border px-2 py-1"><input className="w-full text-xs outline-none" value={row.aceite_codigo || ""} onChange={e => handleChange(index, 'aceite_codigo', e.target.value)} /></td>
                  <td className="border px-2 py-1"><input type="number" className="w-full text-xs outline-none" value={row.aceite_precioxl || ""} onChange={e => handleChange(index, 'aceite_precioxl', e.target.value)} /></td>
                  <td className="border px-2 py-1"><input type="number" className="w-full text-xs outline-none" value={row.aceite_litros || ""} onChange={e => handleChange(index, 'aceite_litros', e.target.value)} /></td>
                  <td className="border px-2 py-1 bg-gray-50 text-right font-mono text-xs">
                    {((parseFloat(row.aceite_precioxl) || 0) * (parseFloat(row.aceite_litros) || 0)).toLocaleString()}
                  </td>

                  {/* Filtro Aceite */}
                  {renderStandardGroup(row, index, "filtro_aceite", handleChange)}

                  {/* Cubiertas */}
                  <td className="border px-2 py-1 text-center"><input type="checkbox" checked={row.cubiertas_cambio || false} onChange={e => handleChange(index, 'cubiertas_cambio', e.target.checked)} /></td>
                  <td className="border px-2 py-1"><input type="number" className="w-full text-xs outline-none" value={row.cubiertas_cantidad || ""} onChange={e => handleChange(index, 'cubiertas_cantidad', e.target.value)} /></td>
                  <td className="border px-2 py-1"><input className="w-full text-xs outline-none" value={row.cubiertas_marca || ""} onChange={e => handleChange(index, 'cubiertas_marca', e.target.value)} /></td>
                  <td className="border px-2 py-1"><input type="number" className="w-full text-xs outline-none" value={row.cubiertas_precio_unit || ""} onChange={e => handleChange(index, 'cubiertas_precio_unit', e.target.value)} /></td>
                  <td className="border px-2 py-1 bg-gray-50 text-right font-mono text-xs">
                    {((parseFloat(row.cubiertas_precio_unit) || 0) * (parseFloat(row.cubiertas_cantidad) || 0)).toLocaleString()}
                  </td>

                  {/* Other standard groups */}
                  {renderStandardGroup(row, index, "filtro_gasoil", handleChange)}
                  {renderStandardGroup(row, index, "trampa_agua", handleChange)}
                  {renderStandardGroup(row, index, "secado_aire", handleChange)}
                  {renderStandardGroup(row, index, "filtro_aire", handleChange)}
                  {renderStandardGroup(row, index, "filtro_habitaculo", handleChange)}
                  {renderStandardGroup(row, index, "bomba_agua", handleChange)}
                  
                  {/* Valvulas (Special: Has "Regular" checkbox instead of code?) User Text: "REGULAR" */}
                  {/* Reuse standard but treat _codigo as Regular? No, use explicit columns */}
                   <td className="border px-2 py-1 text-center"><input type="checkbox" checked={row.valvulas_cambio || false} onChange={e => handleChange(index, 'valvulas_cambio', e.target.checked)} /></td>
                   <td className="border px-2 py-1"><input className="w-full text-xs outline-none" value={row.valvulas_marca || ""} onChange={e => handleChange(index, 'valvulas_marca', e.target.value)} /></td>
                   <td className="border px-2 py-1 text-center"><input type="checkbox" checked={row.valvulas_regular || false} onChange={e => handleChange(index, 'valvulas_regular', e.target.checked)} /></td>
                   <td className="border px-2 py-1"><input type="number" className="w-full text-xs outline-none" value={row.valvulas_precio || ""} onChange={e => handleChange(index, 'valvulas_precio', e.target.value)} /></td>

                  {/* Toberas */}
                  {renderStandardGroup(row, index, "toberas", handleChange)}

                  {/* Extras */}
                  <td className="border px-2 py-1"><input className="w-full text-xs outline-none" value={row.extras_descripcion || ""} onChange={e => handleChange(index, 'extras_descripcion', e.target.value)} /></td>
                  <td className="border px-2 py-1"><input type="number" className="w-full text-xs outline-none" value={row.extras_precio || ""} onChange={e => handleChange(index, 'extras_precio', e.target.value)} /></td>

                  <td className="border px-2 py-1 text-center">
                    <button onClick={() => removeRow(row.id)} className="text-red-500 hover:text-red-700">
                      <FaTrash size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={53} className="px-2 py-4">
                  <button onClick={addRow} className="flex items-center gap-2 bg-brand-navy text-white px-3 py-2 rounded-md font-medium text-sm hover:bg-brand-navy/80 hover:shadow-md transition-all">
                    <FaPlus /> Agregar Registro
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Footer Totals */}
        <div className="bg-content2 p-4 border-t border-divider flex justify-end gap-8 text-sm">
            <div className="flex gap-2">
                <span className="font-bold text-default-500">TOTAL:</span>
                <span className="font-bold text-foreground">${grandTotal.toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
                <span className="font-bold text-default-500">TOTAL c/IVA (21%):</span>
                <span className="font-bold text-foreground">${grandTotalIVA.toLocaleString()}</span>
            </div>
        </div>
      </div>
    </div>
  );
}
