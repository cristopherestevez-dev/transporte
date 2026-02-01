"use client";
import React, { useState, useEffect } from "react";

export default function DriverTripTable({ trips = [] }) {
  // Estado local para los valores editables (tarifas, gastos extras, etc.)
  // Inicializamos con los datos de los viajes si existen, o valores vacíos
  const [data, setData] = useState([]);

  useEffect(() => {
    // Mapear viajes a estructura de filas con calculos
    const initialData = trips.map((t, index) => ({
      id: t.id,
      n: index + 1, // Nuevo campo N°
      fecha: t.fecha_salida || "", // Nuevo campo FECHA
      viaje: `${t.origen} - ${t.destino}`,
      contenedor: t.carga || "",
      // Tarifa
      tarifaTotalAr: 0,
      tarifaChoferPorcentaje: 10, // Default 10%
      tarifaChoferAr: 0, // Columna "CHOFER" (10% de AR)
      tarifaTotalUsd: 0,
      tarifaChoferUsd: 0,
      tarifaChoferUsdAr: 0, // Columna "CHOFER(AR)" (Conversion de USD)
      estadiaCh: 0,
      estadiaAr: 0,
      totalChofer: 0, 

      // Viaticos Chile
      viaticoChileno: 0,
      peajeCh: 0,
      devolCh: 0,
      restoCh: 0, // Calculado
      // Viaticos Argentina
      viaticoArgentino: 0,
      peajeAr: 0,
      devolAr: 0,
      restoAr: 0, // Calculado
      // Finales
      pago: 0,
      subtotal: 0,
    }));
    setData(initialData);
  }, [trips]);

  const handleChange = (id, field, value) => {
    const numValue = parseFloat(value) || 0;
    
    setData((prev) => {
      const newData = prev.map((row) => {
        if (row.id !== id) return row;

        const updatedRow = { ...row, [field]: numValue };

        // --- CALCULOS AUTOMATICOS ---
        // --- CALCULOS AUTOMATICOS ---
        
        // 1. Calculo de Tarifas
        // CHOFER (Col 2) = Total AR * %
        if (field === "tarifaTotalAr" || field === "tarifaChoferPorcentaje") {
             if (updatedRow.tarifaChoferPorcentaje > 0) {
                 updatedRow.tarifaChoferAr = updatedRow.tarifaTotalAr * (updatedRow.tarifaChoferPorcentaje / 100);
             }
        }
        
        // CHOFER USD y CHOFER USD->AR
        if (field === "tarifaTotalUsd" || field === "tarifaChoferPorcentaje") {
             if (updatedRow.tarifaChoferPorcentaje > 0) {
                 updatedRow.tarifaChoferUsd = updatedRow.tarifaTotalUsd * (updatedRow.tarifaChoferPorcentaje / 100);
                 // Auto conversion simple para demo (x 1100) si no se ingresó manual
                 // Idealmente esto seria un campo input separado o una config global
                 if (updatedRow.tarifaChoferUsdAr === 0) { 
                    updatedRow.tarifaChoferUsdAr = updatedRow.tarifaChoferUsd * 1100; 
                 }
             }
        }

        // 2. Total Chofer = CHOFER(AR) + CHOFER(USD->AR) + ESTADIA
        updatedRow.totalChofer = 
            (updatedRow.tarifaChoferAr || 0) + 
            (updatedRow.tarifaChoferUsdAr || 0) + 
            (updatedRow.estadiaCh || 0) + 
            (updatedRow.estadiaAr || 0);

        // 3. Resto Viaticos (Asignado - Gastos - Devoluciones)
        updatedRow.restoCh = 
            (updatedRow.viaticoChileno || 0) - 
            (updatedRow.peajeCh || 0) - 
            (updatedRow.devolCh || 0);
            
        updatedRow.restoAr = 
            (updatedRow.viaticoArgentino || 0) - 
            (updatedRow.peajeAr || 0) - 
            (updatedRow.devolAr || 0);

        // 4. Subtotal (Saldo Final)
        // Total Chofer + Sobrantes de Viaticos - Pagos/Anticipos
        updatedRow.subtotal = 
             updatedRow.totalChofer + 
             updatedRow.restoCh + 
             updatedRow.restoAr - 
             (updatedRow.pago || 0);

        return updatedRow;
      });

      // Persistir en localStorage
      // Necesitamos saber si es nacional o internacional.
      // ESTRATEGIA: Buscar en ambas listas y actualizar si existe.
      const updatedItem = newData.find(r => r.id === id);
      if (updatedItem) {
          const storedNacionales = localStorage.getItem("viajesNacionales");
          const storedInternacionales = localStorage.getItem("viajesInternacionales");
          
          let nac = storedNacionales ? JSON.parse(storedNacionales) : [];
          let int = storedInternacionales ? JSON.parse(storedInternacionales) : [];
          
          let found = false;
          const newNac = nac.map(t => {
              if (t.id === id) { found = true; return { ...t, ...updatedItem }; }
              return t;
          });
          
          if (found) {
              localStorage.setItem("viajesNacionales", JSON.stringify(newNac));
          } else {
              const newInt = int.map(t => {
                  if (t.id === id) { return { ...t, ...updatedItem }; }
                  return t;
              });
              localStorage.setItem("viajesInternacionales", JSON.stringify(newInt));
          }
      }

      return newData;
    });
  };

  const InputCell = ({ row, field, bg = "bg-white" }) => (
    <input
      type="number"
      className={`w-full h-full text-right px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 ${bg}`}
      value={row[field] === 0 ? "" : row[field]}
      onChange={(e) => handleChange(row.id, field, e.target.value)}
    />
  );

  return (
    <div className="overflow-x-auto border rounded shadow-lg">
      <table className="min-w-full text-xs border-collapse">
        <thead>
          {/* Fila 1 */}
          <tr className="bg-gray-100 text-center font-bold border-b text-[10px] md:text-xs">
            <th className="border p-1 bg-cyan-300" rowSpan={3}>N°</th>
            <th className="border p-1 bg-cyan-300" rowSpan={3}>FECHA</th>
            <th className="border p-1 bg-cyan-300" rowSpan={3}>VIAJE</th>
            <th className="border p-1 bg-cyan-300" rowSpan={3}>CONTENEDOR N° O CARGA</th>
            <th className="border p-1 bg-orange-400" colSpan={8}>TARIFA</th>
            <th className="border p-1 bg-green-400" colSpan={8}>VIATICOS</th>
            <th className="border p-1 bg-red-400" rowSpan={3}>PAGO</th>
            <th className="border p-1 bg-yellow-200" rowSpan={3}>SUBTOTALES</th>
          </tr>
          {/* Fila 2 */}
          <tr className="bg-gray-50 text-center font-semibold border-b text-[10px] md:text-xs">
            {/* Tarifa Subheaders */}
            <th className="border p-1 bg-orange-300">TOTAL(AR)</th>
            <th className="border p-1 bg-orange-300">CHOFER</th>
            <th className="border p-1 bg-orange-300">TOTAL(USD)</th>
            <th className="border p-1 bg-orange-300">CHOFER(USD)</th>
            <th className="border p-1 bg-orange-300">CHOFER(AR)</th>
            <th className="border p-1 bg-orange-300" colSpan={2}>ESTADIA</th>
            <th className="border p-1 bg-gray-400 text-white">TOTAL CHOFER</th>
            
            {/* Viaticos Subheaders */}
            <th className="border p-1 bg-green-300">CHILENO</th>
            <th className="border p-1 bg-green-300">PEAJE CH</th>
            <th className="border p-1 bg-green-300">DEVOL CH</th>
            <th className="border p-1 bg-gray-400 text-white">RESTO CH</th>
            <th className="border p-1 bg-green-300">ARGENTINO</th>
            <th className="border p-1 bg-green-300">PEAJE AR</th>
            <th className="border p-1 bg-green-300">DEVOL AR</th>
            <th className="border p-1 bg-gray-400 text-white">RESTO AR</th>
          </tr>
          {/* Fila 3 */}
          <tr className="bg-gray-50 text-center font-semibold border-b text-[10px] md:text-xs">
            <th className="border p-1 bg-orange-200"></th>{/* Placeholder alignment */}
            <th className="border p-1 bg-orange-200">%</th>
            <th className="border p-1 bg-orange-200"></th>
            <th className="border p-1 bg-orange-200"></th>
            <th className="border p-1 bg-orange-200"></th>
            <th className="border p-1 bg-orange-200">CH</th>
            <th className="border p-1 bg-orange-200">AR</th>
            <th className="border p-1 bg-gray-300"></th>

            {/* Viaticos row 3 empty placeholders */}
            <th className="border p-1 bg-green-200"></th>
            <th className="border p-1 bg-green-200"></th>
            <th className="border p-1 bg-green-200"></th>
            <th className="border p-1 bg-gray-300"></th>
            <th className="border p-1 bg-green-200"></th>
            <th className="border p-1 bg-green-200"></th>
            <th className="border p-1 bg-green-200"></th>
            <th className="border p-1 bg-gray-300"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              <td className="border px-2 py-1 text-center">{row.n}</td>
              <td className="border px-2 py-1 text-center whitespace-nowrap">{row.fecha}</td>
              <td className="border px-2 py-1 text-left truncate max-w-[150px]">{row.viaje}</td>
              <td className="border px-2 py-1 text-left">{row.contenedor}</td>

              {/* TARIFA */}
              <td className="border p-0"><InputCell row={row} field="tarifaTotalAr" /></td>
              <td className="border p-0"><InputCell row={row} field="tarifaChoferPorcentaje" /></td>
              <td className="border p-0"><InputCell row={row} field="tarifaTotalUsd" /></td>
              <td className="border p-0"><InputCell row={row} field="tarifaChoferUsd" /></td>
              <td className="border p-0"><InputCell row={row} field="tarifaChoferUsdAr" /></td>
              <td className="border p-0"><InputCell row={row} field="estadiaCh" /></td>
              <td className="border p-0"><InputCell row={row} field="estadiaAr" /></td>
              <td className="border px-2 py-1 text-right font-bold bg-gray-200">{row.totalChofer.toLocaleString()}</td>

              {/* VIATICOS CHILE */}
              <td className="border p-0"><InputCell row={row} field="viaticoChileno" /></td>
              <td className="border p-0"><InputCell row={row} field="peajeCh" /></td>
              <td className="border p-0"><InputCell row={row} field="devolCh" /></td>
              <td className="border px-2 py-1 text-right font-bold bg-gray-200">{row.restoCh.toLocaleString()}</td>

              {/* VIATICOS ARG */}
              <td className="border p-0"><InputCell row={row} field="viaticoArgentino" /></td>
              <td className="border p-0"><InputCell row={row} field="peajeAr" /></td>
              <td className="border p-0"><InputCell row={row} field="devolAr" /></td>
              <td className="border px-2 py-1 text-right font-bold bg-gray-200">{row.restoAr.toLocaleString()}</td>

              {/* PAGO / SUBTOTAL */}
              <td className="border p-0 bg-red-100"><InputCell row={row} field="pago" bg="bg-red-50" /></td>
              <td className="border px-2 py-1 text-right font-bold bg-yellow-100">{row.subtotal.toLocaleString()}</td>
            </tr>
          ))}
          {/* TOTALES GENERALES */}
          <tr className="font-bold bg-gray-200 text-[10px] md:text-xs">
             <td colSpan={4} className="border p-2 text-right">TOTALES</td>
             {/* TARIFA */}
             <td className="border p-1 text-right">{data.reduce((a, b) => a + (b.tarifaTotalAr||0), 0).toLocaleString()}</td>
             <td className="border p-1"></td>{/* % */}
             <td className="border p-1 text-right">{data.reduce((a, b) => a + (b.tarifaTotalUsd||0), 0).toLocaleString()}</td>
             <td className="border p-1 text-right">{data.reduce((a, b) => a + (b.tarifaChoferUsd||0), 0).toLocaleString()}</td>
             <td className="border p-1 text-right">{data.reduce((a, b) => a + (b.tarifaChoferUsdAr||0), 0).toLocaleString()}</td>
             <td className="border p-1 text-right">{data.reduce((a, b) => a + (b.estadiaCh||0), 0).toLocaleString()}</td>
             <td className="border p-1 text-right">{data.reduce((a, b) => a + (b.estadiaAr||0), 0).toLocaleString()}</td>
             <td className="border p-1 text-right bg-gray-300">{data.reduce((a, b) => a + (b.totalChofer||0), 0).toLocaleString()}</td>
             
             {/* VIATICOS */}
             <td className="border p-1 text-right">{data.reduce((a, b) => a + (b.viaticoChileno||0), 0).toLocaleString()}</td>
             <td className="border p-1 text-right">{data.reduce((a, b) => a + (b.peajeCh||0), 0).toLocaleString()}</td>
             <td className="border p-1 text-right">{data.reduce((a, b) => a + (b.devolCh||0), 0).toLocaleString()}</td>
             <td className="border p-1 text-right bg-gray-300">{data.reduce((a, b) => a + (b.restoCh||0), 0).toLocaleString()}</td>
             <td className="border p-1 text-right">{data.reduce((a, b) => a + (b.viaticoArgentino||0), 0).toLocaleString()}</td>
             <td className="border p-1 text-right">{data.reduce((a, b) => a + (b.peajeAr||0), 0).toLocaleString()}</td>
             <td className="border p-1 text-right">{data.reduce((a, b) => a + (b.devolAr||0), 0).toLocaleString()}</td>
             <td className="border p-1 text-right bg-gray-300">{data.reduce((a, b) => a + (b.restoAr||0), 0).toLocaleString()}</td>

             {/* FINAL */}
             <td className="border p-1 text-right bg-red-200">{data.reduce((a, b) => a + (b.pago||0), 0).toLocaleString()}</td>
             <td className="border p-1 text-right bg-yellow-300">{data.reduce((a, b) => a + (b.subtotal||0), 0).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
