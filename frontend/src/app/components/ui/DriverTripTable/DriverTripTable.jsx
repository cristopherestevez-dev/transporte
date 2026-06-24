"use client";
import React, { useState, useEffect } from "react";
import { useToast } from "../Toast/Toast";

const InputCell = ({ row, field, bg = "bg-content1", onChange }) => (
  <input
    type="number"
    className={`w-full h-full text-right px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 ${bg}`}
    value={row[field] === 0 ? "" : row[field]}
    onChange={(e) => onChange(row.id, field, e.target.value)}
  />
);

export default function DriverTripTable({ trips = [] }) {
  // Estado local para los valores editables (tarifas, gastos extras, etc.)
  // Inicializamos con los datos de los viajes si existen, o valores vacíos
  const [data, setData] = useState([]);

  useEffect(() => {
    // Obtener cotizaciones frescas
    const savedDolar = localStorage.getItem("cotizacionDolar");
    const savedClp = localStorage.getItem("cotizacionPesoChileno");
    const dolarRate = parseFloat(savedDolar) || 1100;
    const clpRate = parseFloat(savedClp) || 1.2;

    // Obtener viajes guardados localmente (legacy/fallback)
    const storedNac = localStorage.getItem("viajesNacionales");
    const storedInt = localStorage.getItem("viajesInternacionales");
    const nac = storedNac ? JSON.parse(storedNac) : [];
    const int = storedInt ? JSON.parse(storedInt) : [];
    const localTrips = [...nac, ...int];

    // Mapear viajes a estructura de filas con calculos
    const initialData = trips.map((t, index) => {
      const tripId = t._id || t.id;
      // Intentar encontrar si hay datos guardados localmente para este viaje
      const localTrip = localTrips.find((lt) => lt.id === tripId || lt._id === tripId);

      // Helper para priorizar base de datos del back (t) sobre cache local (localTrip)
      const getVal = (key, defaultValue) => {
        if (t[key] !== undefined && t[key] !== null) return t[key];
        if (localTrip?.[key] !== undefined && localTrip?.[key] !== null) return localTrip[key];
        return defaultValue;
      };

      const tarifaTotalAr = parseFloat(getVal("tarifaTotalAr", 0)) || 0;
      const tarifaChoferPorcentaje = parseFloat(getVal("tarifaChoferPorcentaje", 10)) || 10;
      const tarifaChoferAr = tarifaTotalAr * (tarifaChoferPorcentaje / 100);

      const tarifaTotalUsd = parseFloat(getVal("tarifaTotalUsd", 0)) || 0;
      const tarifaChoferUsd = tarifaTotalUsd * (tarifaChoferPorcentaje / 100);
      
      let tarifaChoferUsdAr = 0;
      if (getVal("tarifaChoferUsdAr", null) !== null) {
        tarifaChoferUsdAr = parseFloat(getVal("tarifaChoferUsdAr", 0)) || 0;
      } else {
        tarifaChoferUsdAr = tarifaChoferUsd * dolarRate;
      }

      const estadiaCh = parseFloat(getVal("estadiaCh", 0)) || 0;
      const estadiaAr = parseFloat(getVal("estadiaAr", 0)) || 0;

      // TOTAL CHOFER (en ARS)
      // tarifaChoferAr (ARS) + tarifaChoferUsdAr (ARS) + (estadiaCh * clpRate) (ARS) + estadiaAr (ARS)
      const totalChofer =
        tarifaChoferAr +
        tarifaChoferUsdAr +
        (estadiaCh * clpRate) +
        estadiaAr;

      // Viaticos Chile
      const viaticoChileno = parseFloat(getVal("viaticoChileno", 0)) || 0;
      const peajeCh = parseFloat(getVal("peajeCh", 0)) || 0;
      const devolCh = parseFloat(getVal("devolCh", 0)) || 0;
      const restoCh = viaticoChileno - peajeCh - devolCh;

      // Viaticos Argentina
      const viaticoArgentino = parseFloat(getVal("viaticoArgentino", 0)) || 0;
      const peajeAr = parseFloat(getVal("peajeAr", 0)) || 0;
      const devolAr = parseFloat(getVal("devolAr", 0)) || 0;
      const restoAr = viaticoArgentino - peajeAr - devolAr;

      // Adelantos
      const adelantoMonto = parseFloat(getVal("adelantoMonto", 0)) || 0;
      const adelantoMoneda = getVal("adelantoMoneda", "ARS");
      
      let adelantoAr = 0;
      if (adelantoMoneda === "ARS") {
        adelantoAr = adelantoMonto;
      } else if (adelantoMoneda === "CLP") {
        adelantoAr = adelantoMonto * clpRate;
      } else if (adelantoMoneda === "USD") {
        adelantoAr = adelantoMonto * dolarRate;
      }

      // Subtotal (en ARS antes de adelantos)
      // totalChofer (ARS) - (restoCh * clpRate) (ARS) - restoAr (ARS)
      const subtotal = totalChofer - (restoCh * clpRate) - restoAr;

      // Pago (Final net payment = Subtotal - Adelantos)
      const pago = subtotal - adelantoAr;

      return {
        id: tripId,
        tipoViaje: t.tipoViaje || "nacional",
        n: index + 1,
        fecha: t.fecha_salida || "",
        viaje: `${t.origen} - ${t.destino}`,
        contenedor: t.carga || "",
        tarifaTotalAr,
        tarifaChoferPorcentaje,
        tarifaChoferAr,
        tarifaTotalUsd,
        tarifaChoferUsd,
        tarifaChoferUsdAr,
        estadiaCh,
        estadiaAr,
        totalChofer,
        viaticoChileno,
        peajeCh,
        devolCh,
        restoCh,
        viaticoArgentino,
        peajeAr,
        devolAr,
        restoAr,
        adelantoMonto,
        adelantoMoneda,
        adelantoAr,
        pago,
        subtotal,
      };
    });
    setData(initialData);
  }, [trips]);

  const handleChange = (id, field, value) => {
    const numValue = field === "adelantoMoneda" ? 0 : (parseFloat(value) || 0);

    // Obtener cotizaciones frescas
    const savedDolar = localStorage.getItem("cotizacionDolar");
    const savedClp = localStorage.getItem("cotizacionPesoChileno");
    const dolarRate = savedDolar ? parseFloat(savedDolar) : 1100;
    const clpRate = savedClp ? parseFloat(savedClp) : 1.2;

    setData((prev) => {
      const newData = prev.map((row) => {
        if (row.id !== id) return row;

        const updatedRow = { ...row, [field]: field === "adelantoMoneda" ? value : numValue };

        // --- CALCULOS AUTOMATICOS ---

        // 1. Calculo de Tarifas
        if (field === "tarifaTotalAr" || field === "tarifaChoferPorcentaje") {
          updatedRow.tarifaChoferAr =
            updatedRow.tarifaTotalAr *
            (updatedRow.tarifaChoferPorcentaje / 100);
        }

        // CHOFER USD y CHOFER USD->AR
        if (field === "tarifaTotalUsd" || field === "tarifaChoferPorcentaje") {
          updatedRow.tarifaChoferUsd =
            updatedRow.tarifaTotalUsd *
            (updatedRow.tarifaChoferPorcentaje / 100);
          
          if (field !== "tarifaChoferUsdAr") {
            updatedRow.tarifaChoferUsdAr = updatedRow.tarifaChoferUsd * dolarRate;
          }
        }

        if (field === "tarifaChoferUsdAr") {
          updatedRow.tarifaChoferUsdAr = numValue;
        }

        // 2. Total Chofer (ARS) = CHOFER(AR) + CHOFER(USD->AR) + (ESTADIA CH * clpRate) + ESTADIA AR
        updatedRow.totalChofer =
          (updatedRow.tarifaChoferAr || 0) +
          (updatedRow.tarifaChoferUsdAr || 0) +
          ((updatedRow.estadiaCh || 0) * clpRate) +
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

        // 4. Adelantos
        const adelantoMonto = field === "adelantoMonto" ? numValue : (updatedRow.adelantoMonto || 0);
        const adelantoMoneda = field === "adelantoMoneda" ? value : (updatedRow.adelantoMoneda || "ARS");
        updatedRow.adelantoMonto = adelantoMonto;
        updatedRow.adelantoMoneda = adelantoMoneda;

        let adelantoAr = 0;
        if (updatedRow.adelantoMoneda === "ARS") {
          adelantoAr = updatedRow.adelantoMonto;
        } else if (updatedRow.adelantoMoneda === "CLP") {
          adelantoAr = updatedRow.adelantoMonto * clpRate;
        } else if (updatedRow.adelantoMoneda === "USD") {
          adelantoAr = updatedRow.adelantoMonto * dolarRate;
        }
        updatedRow.adelantoAr = adelantoAr;

        // 5. Subtotal (Saldo Final en ARS antes de adelantos)
        updatedRow.subtotal =
          updatedRow.totalChofer -
          (updatedRow.restoCh * clpRate) -
          updatedRow.restoAr;

        // 6. Pago (Neto a pagar = Subtotal - Adelantos)
        updatedRow.pago = updatedRow.subtotal - updatedRow.adelantoAr;

        return updatedRow;
      });

      // Persistir en localStorage
      // Necesitamos saber si es nacional o internacional.
      // ESTRATEGIA: Buscar en ambas listas y actualizar si existe.
      const updatedItem = newData.find((r) => r.id === id);
      if (updatedItem) {
        const storedNacionales = localStorage.getItem("viajesNacionales");
        const storedInternacionales = localStorage.getItem(
          "viajesInternacionales",
        );

        let nac = storedNacionales ? JSON.parse(storedNacionales) : [];
        let int = storedInternacionales
          ? JSON.parse(storedInternacionales)
          : [];

        let found = false;
        const newNac = nac.map((t) => {
          if (t.id === id || t._id === id) {
            found = true;
            return { ...t, ...updatedItem };
          }
          return t;
        });

        if (found) {
          localStorage.setItem("viajesNacionales", JSON.stringify(newNac));
        } else {
          const newInt = int.map((t) => {
            if (t.id === id || t._id === id) {
              return { ...t, ...updatedItem };
            }
            return t;
          });
          localStorage.setItem("viajesInternacionales", JSON.stringify(newInt));
        }
      }

      return newData;
    });
  };

  const renderInput = (row, field, bg) => (
    <InputCell row={row} field={field} bg={bg} onChange={handleChange} />
  );

  const toast = useToast();
  const [savingPlanilla, setSavingPlanilla] = useState(false);

  const handleSaveAll = async () => {
    setSavingPlanilla(true);
    try {
      await Promise.all(
        data.map(async (row) => {
          const endpoint = row.tipoViaje === "nacional" ? "nacionales" : "internacionales";
          const url = `http://localhost:3001/api/viajes/${endpoint}/${row.id}`;
          
          const payload = {
            tarifaTotalAr: row.tarifaTotalAr,
            tarifaChoferPorcentaje: row.tarifaChoferPorcentaje,
            tarifaChoferAr: row.tarifaChoferAr,
            tarifaTotalUsd: row.tarifaTotalUsd,
            tarifaChoferUsd: row.tarifaChoferUsd,
            tarifaChoferUsdAr: row.tarifaChoferUsdAr,
            estadiaCh: row.estadiaCh,
            estadiaAr: row.estadiaAr,
            totalChofer: row.totalChofer,
            viaticoChileno: row.viaticoChileno,
            peajeCh: row.peajeCh,
            devolCh: row.devolCh,
            restoCh: row.restoCh,
            viaticoArgentino: row.viaticoArgentino,
            peajeAr: row.peajeAr,
            devolAr: row.devolAr,
            restoAr: row.restoAr,
            adelantoMonto: row.adelantoMonto,
            adelantoMoneda: row.adelantoMoneda,
            adelantoAr: row.adelantoAr,
            pago: row.pago,
            subtotal: row.subtotal,
          };

          const res = await fetch(url, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error("Error al guardar una de las filas");
        })
      );
      toast.success("Planilla guardada en el servidor correctamente");
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar la planilla: " + err.message);
    } finally {
      setSavingPlanilla(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handleSaveAll}
          disabled={savingPlanilla}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 text-sm shadow flex items-center gap-2"
        >
          {savingPlanilla ? "Guardando..." : "Guardar Planilla en Servidor"}
        </button>
      </div>

      <div className="overflow-x-auto border border-divider rounded shadow-lg">
      <table className="min-w-full text-xs border-collapse">
        <thead>
          {/* Fila 1 */}
          <tr className="bg-content2 text-center font-bold border-b border-divider text-[10px] md:text-xs">
            <th className="border p-1 bg-cyan-300" rowSpan={3}>
              N°
            </th>
            <th className="border p-1 bg-cyan-300" rowSpan={3}>
              FECHA
            </th>
            <th className="border p-1 bg-cyan-300" rowSpan={3}>
              VIAJE
            </th>
            <th className="border p-1 bg-cyan-300" rowSpan={3}>
              CONTENEDOR N° O CARGA
            </th>
            <th className="border p-1 bg-orange-400" colSpan={8}>
              TARIFA
            </th>
            <th className="border p-1 bg-green-400" colSpan={8}>
              VIATICOS
            </th>
            <th className="border p-1 bg-purple-500 text-white" rowSpan={3}>
              ADELANTOS
            </th>
            <th className="border p-1 bg-emerald-500 text-white animate-pulse" rowSpan={3}>
              PAGO (ARS)
            </th>
            <th className="border p-1 bg-yellow-300" rowSpan={3}>
              SUBTOTALES
            </th>
          </tr>
          {/* Fila 2 */}
          <tr className="bg-content2/50 text-center font-semibold border-b border-divider text-[10px] md:text-xs">
            {/* Tarifa Subheaders */}
            <th className="border p-1 bg-orange-300">CHOFER</th>
            <th className="border p-1 bg-orange-300">TOTAL(AR)</th>
            <th className="border p-1 bg-orange-300">TOTAL(USD)</th>
            <th className="border p-1 bg-orange-300">CHOFER(USD)</th>
            <th className="border p-1 bg-orange-300">CHOFER(AR)</th>
            <th className="border p-1 bg-orange-300" colSpan={2}>
              ESTADIA
            </th>
            <th className="border border-divider p-1 bg-default-500 text-white">
              TOTAL CHOFER
            </th>

            {/* Viaticos Subheaders */}
            <th className="border p-1 bg-green-300">CHILENO</th>
            <th className="border p-1 bg-green-300">PEAJE CH</th>
            <th className="border p-1 bg-green-300">DEVOL CH</th>
            <th className="border border-divider p-1 bg-default-500 text-white">
              RESTO CH
            </th>
            <th className="border p-1 bg-green-300">ARGENTINO</th>
            <th className="border p-1 bg-green-300">PEAJE AR</th>
            <th className="border p-1 bg-green-300">DEVOL AR</th>
            <th className="border border-divider p-1 bg-default-500 text-white">
              RESTO AR
            </th>
          </tr>
          {/* Fila 3 */}
          <tr className="bg-content2/50 text-center font-semibold border-b border-divider text-[10px] md:text-xs">
            <th className="border p-1 bg-orange-200">%</th>
            {/* Placeholder alignment */}
            <th className="border p-1 bg-orange-200"></th>
            <th className="border p-1 bg-orange-200"></th>
            <th className="border p-1 bg-orange-200"></th>
            <th className="border p-1 bg-orange-200"></th>
            <th className="border p-1 bg-orange-200">CH</th>
            <th className="border p-1 bg-orange-200">AR</th>
            <th className="border border-divider p-1 bg-default-300"></th>

            {/* Viaticos row 3 empty placeholders */}
            <th className="border p-1 bg-green-200"></th>
            <th className="border p-1 bg-green-200"></th>
            <th className="border p-1 bg-green-200"></th>
            <th className="border border-divider p-1 bg-default-300"></th>
            <th className="border p-1 bg-green-200"></th>
            <th className="border p-1 bg-green-200"></th>
            <th className="border p-1 bg-green-200"></th>
            <th className="border border-divider p-1 bg-default-300"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-content2/50">
              <td className="border px-2 py-1 text-center">{row.n}</td>
              <td className="border px-2 py-1 text-center whitespace-nowrap">
                {row.fecha}
              </td>
              <td className="border px-2 py-1 text-left truncate max-w-[150px]">
                {row.viaje}
              </td>
              <td className="border px-2 py-1 text-left">{row.contenedor}</td>

              {/* TARIFA */}
              <td className="border p-0">
                {renderInput(row, "tarifaChoferPorcentaje")}
              </td>
              <td className="border p-0">
                {renderInput(row, "tarifaTotalAr")}
              </td>
              <td className="border p-0">
                {renderInput(row, "tarifaTotalUsd")}
              </td>
              <td className="border p-0">
                {renderInput(row, "tarifaChoferUsd")}
              </td>
              <td className="border p-0">
                {renderInput(row, "tarifaChoferUsdAr")}
              </td>
              <td className="border p-0">
                {renderInput(row, "estadiaCh")}
              </td>
              <td className="border p-0">
                {renderInput(row, "estadiaAr")}
              </td>
              <td className="border px-2 py-1 text-right font-bold bg-default-200">
                {row.totalChofer.toLocaleString()}
              </td>

              {/* VIATICOS CHILE */}
              <td className="border p-0">
                {renderInput(row, "viaticoChileno")}
              </td>
              <td className="border p-0">
                {renderInput(row, "peajeCh")}
              </td>
              <td className="border p-0">
                {renderInput(row, "devolCh")}
              </td>
              <td className="border px-2 py-1 text-right font-bold bg-default-200">
                {row.restoCh.toLocaleString()}
              </td>

              {/* VIATICOS ARG */}
              <td className="border p-0">
                {renderInput(row, "viaticoArgentino")}
              </td>
              <td className="border p-0">
                {renderInput(row, "peajeAr")}
              </td>
              <td className="border p-0">
                {renderInput(row, "devolAr")}
              </td>
              <td className="border px-2 py-1 text-right font-bold bg-default-200">
                {row.restoAr.toLocaleString()}
              </td>

              {/* ADELANTOS */}
              <td className="border p-0 min-w-[130px]">
                <div className="flex items-center h-full bg-content1">
                  <input
                    type="number"
                    className="w-full h-full text-right px-1 focus:outline-none bg-transparent text-foreground"
                    value={row.adelantoMonto === 0 ? "" : row.adelantoMonto}
                    onChange={(e) => handleChange(row.id, "adelantoMonto", e.target.value)}
                    placeholder="0"
                  />
                  <select
                    className="bg-content2 text-[10px] text-foreground border-l border-divider px-1 h-full outline-none cursor-pointer font-bold"
                    value={row.adelantoMoneda || "ARS"}
                    onChange={(e) => handleChange(row.id, "adelantoMoneda", e.target.value)}
                  >
                    <option value="ARS">ARS</option>
                    <option value="CLP">CLP</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </td>

              {/* PAGO (Highlight calculated final payment) */}
              <td className="border px-2 py-1 text-right font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {row.pago.toLocaleString()}
              </td>

              {/* SUBTOTALES */}
              <td className="border px-2 py-1 text-right font-bold bg-yellow-500/15">
                {row.subtotal.toLocaleString()}
              </td>
            </tr>
          ))}
          {/* TOTALES GENERALES */}
          <tr className="font-bold bg-default-200 text-[10px] md:text-xs">
            <td colSpan={4} className="border p-2 text-right">
              TOTALES
            </td>
            {/* % */}
            <td className="border p-1"></td>
            {/* TARIFA */}
            <td className="border p-1 text-right">
              {data
                .reduce((a, b) => a + (b.tarifaTotalAr || 0), 0)
                .toLocaleString()}
            </td>
            {/* TOTAL(USD) */}
            <td className="border p-1 text-right">
              {data
                .reduce((a, b) => a + (b.tarifaTotalUsd || 0), 0)
                .toLocaleString()}
            </td>
            <td className="border p-1 text-right">
              {data
                .reduce((a, b) => a + (b.tarifaChoferUsd || 0), 0)
                .toLocaleString()}
            </td>
            <td className="border p-1 text-right">
              {data
                .reduce((a, b) => a + (b.tarifaChoferUsdAr || 0), 0)
                .toLocaleString()}
            </td>
            <td className="border p-1 text-right">
              {data
                .reduce((a, b) => a + (b.estadiaCh || 0), 0)
                .toLocaleString()}
            </td>
            <td className="border p-1 text-right">
              {data
                .reduce((a, b) => a + (b.estadiaAr || 0), 0)
                .toLocaleString()}
            </td>
            <td className="border p-1 text-right bg-default-300">
              {data
                .reduce((a, b) => a + (b.totalChofer || 0), 0)
                .toLocaleString()}
            </td>

            {/* VIATICOS */}
            <td className="border p-1 text-right">
              {data
                .reduce((a, b) => a + (b.viaticoChileno || 0), 0)
                .toLocaleString()}
            </td>
            <td className="border p-1 text-right">
              {data.reduce((a, b) => a + (b.peajeCh || 0), 0).toLocaleString()}
            </td>
            <td className="border p-1 text-right">
              {data.reduce((a, b) => a + (b.devolCh || 0), 0).toLocaleString()}
            </td>
            <td className="border p-1 text-right bg-default-300">
              {data.reduce((a, b) => a + (b.restoCh || 0), 0).toLocaleString()}
            </td>
            <td className="border p-1 text-right">
              {data
                .reduce((a, b) => a + (b.viaticoArgentino || 0), 0)
                .toLocaleString()}
            </td>
            <td className="border p-1 text-right">
              {data.reduce((a, b) => a + (b.peajeAr || 0), 0).toLocaleString()}
            </td>
            <td className="border p-1 text-right">
              {data.reduce((a, b) => a + (b.devolAr || 0), 0).toLocaleString()}
            </td>
            <td className="border p-1 text-right bg-default-300">
              {data.reduce((a, b) => a + (b.restoAr || 0), 0).toLocaleString()}
            </td>

            {/* ADELANTOS */}
            <td className="border p-1 text-right bg-purple-500/10 text-purple-600 dark:text-purple-400">
              {data
                .reduce((a, b) => a + (b.adelantoAr || 0), 0)
                .toLocaleString()}
            </td>

            {/* PAGO TOTAL HIGHLIGHTED */}
            <td className="border p-2 text-right bg-emerald-600 text-white font-extrabold text-xs shadow-inner uppercase tracking-wide">
              $ {data
                .reduce((a, b) => a + (b.pago || 0), 0)
                .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>

            {/* SUBTOTAL */}
            <td className="border p-1 text-right bg-yellow-500/20">
              {data
                .reduce((a, b) => a + (b.subtotal || 0), 0)
                .toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  );
}
