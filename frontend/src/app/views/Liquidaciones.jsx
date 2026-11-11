"use client";

import Button from "@/app/components/ui/Button/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/services/api";
import styles from "./Liquidaciones.module.css";

const endpoint = "/liquidaciones";
const monedas = ["ARS", "CLP", "USD"];
const importe = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inputStyle = "rounded-md border border-divider bg-content1 p-2 text-foreground";
const buttonStyle = "rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50";

function Saldos({ saldos }) {
  return (
    <dl className="flex flex-wrap gap-6">
      {monedas.map(moneda => (
        <div key={moneda}>
          <dt>{moneda}</dt>
          <dd className="font-semibold">{importe.format(saldos[moneda] / 100)}</dd>
        </div>
      ))}
    </dl>
  );
}

const etiquetasMoneda = { ARS: "Pesos argentinos (ARS)", USD: "Dólares (USD)", CLP: "Pesos chilenos (CLP)" };
const formatoTasa = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 8 });

function Conversion({ conversion }) {
  if (!conversion) return null;
  const { moneda, total, cotizaciones } = conversion;
  const formato = new Intl.NumberFormat("es-AR", { style: "currency", currency: moneda, currencyDisplay: "code" });
  return (
    <div className="space-y-1 rounded-lg bg-content2 p-3">
      <p>Total a liquidar</p>
      <p className="text-lg font-semibold">{formato.format(total / 100)}</p>
      {Object.entries(cotizaciones).map(([origen, tasa]) => (
        <p className="text-sm" key={origen}>1 {origen} = {formatoTasa.format(tasa)} ARS</p>
      ))}
    </div>
  );
}

function Detalle({ datos, seleccion, cambiarSeleccion, seleccionarTodos, ocupado = false }) {
  const cantidad = datos.viajes.filter(viaje => seleccion?.has(viaje.clave)).length;
  const todosIncluidos = cantidad > 0 && cantidad === datos.viajes.length;
  return (
    <div className="space-y-3">
      <p>{datos.responsable} ({datos.filtros.tipo}) · {datos.filtros.desde} al {datos.filtros.hasta}</p>
      <Saldos saldos={datos.saldos} />
      <Conversion conversion={datos.conversion} />
      <div className="table-frame">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {seleccion && (
                <th className="p-2" scope="col">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      aria-label="Incluir todos los viajes"
                      checked={todosIncluidos}
                      disabled={ocupado || !datos.viajes.length}
                      ref={input => { if (input) input.indeterminate = cantidad > 0 && !todosIncluidos; }}
                      onChange={evento => seleccionarTodos(evento.target.checked)}
                    />
                    Incluir
                  </label>
                </th>
              )}
              {["Salida", "Tipo", "Origen", "Destino", ...monedas].map(titulo => (
                <th className="p-2" key={titulo} scope="col">{titulo}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {datos.viajes.map(viaje => (
              <tr key={viaje.clave} className="border-t border-divider">
                {seleccion && (
                  <td className="p-2">
                    <input type="checkbox" disabled={ocupado} checked={seleccion.has(viaje.clave)} onChange={() => cambiarSeleccion(viaje.clave)}
                      aria-label={`Incluir viaje ${viaje.tipoViaje} de ${viaje.origen} a ${viaje.destino}, ${viaje.fechaSalida}, ${viaje.clave.split(":")[1]}`} />
                  </td>
                )}
                <td className="p-2">{viaje.fechaSalida}</td>
                <td className="p-2">{viaje.tipoViaje}</td>
                <td className="p-2">{viaje.origen}</td>
                <td className="p-2">{viaje.destino}</td>
                {monedas.map(moneda => <td className="p-2" key={moneda}>{importe.format(viaje.saldos[moneda] / 100)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Liquidaciones() {
  const [filtros, setFiltros] = useState({ desde: "", hasta: "", tipo: "chofer", responsableId: "" });
  const [responsables, setResponsables] = useState(null);
  const [previa, setPrevia] = useState(null);
  const [seleccion, setSeleccion] = useState(() => new Set());
  const [comprobante, setComprobante] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [errorCarga, setErrorCarga] = useState("");
  const [moneda, setMoneda] = useState("");
  const [tasas, setTasas] = useState({ USD: "", CLP: "" });

  useEffect(() => {
    setTasas({
      USD: localStorage.getItem("cotizacionDolar") ?? "",
      CLP: localStorage.getItem("cotizacionPesoChileno") ?? "",
    });
  }, []);

  useEffect(() => {
    let activo = true;
    const comprobanteId = new URLSearchParams(window.location.search).get("comprobante");
    const recibo = comprobanteId ? api.get(endpoint + "/" + encodeURIComponent(comprobanteId)) : Promise.resolve(null);
    if (comprobanteId) setOcupado(true);
    Promise.allSettled([api.getChoferes(), api.getFleteros(), api.get(endpoint), recibo]).then(([choferes, fleteros, pagina, resultado]) => {
      if (!activo) return;
      setResponsables({ chofer: choferes.value || [], fletero: fleteros.value || [] });
      setHistorial(pagina.value || null);
      const errores = [];
      if (choferes.status === "rejected") errores.push("No se pudieron cargar los choferes.");
      if (fleteros.status === "rejected") errores.push("No se pudieron cargar los fleteros.");
      if (pagina.status === "rejected") errores.push("No se pudo cargar el historial.");
      if (comprobanteId) {
        setOcupado(false);
        if (resultado.status === "fulfilled") setComprobante(resultado.value);
        else errores.push(resultado.reason.message);
      }
      setErrorCarga(errores.join(" "));
    });
    return () => { activo = false; };
  }, []);

  function cambiar(evento) {
    const { name, value } = evento.target;
    setFiltros(actual => ({ ...actual, [name]: value, ...(name === "tipo" ? { responsableId: "" } : {}) }));
    setPrevia(null);
    setError("");
  }

  async function ejecutar(accion) {
    setOcupado(true);
    setError("");
    try {
      await accion();
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setOcupado(false);
    }
  }

  function consultar(evento) {
    evento.preventDefault();
    setPrevia(null);
    setSeleccion(new Set());
    setComprobante(null);
    ejecutar(async () => setPrevia(await api.get(endpoint + "/vista-previa?" + new URLSearchParams(filtros))));
  }

  function confirmar() {
    if (ocupado || !seleccion.size || (moneda && !conversion)) return;
    const entrada = {
      filtros: previa.filtros,
      ...(moneda ? { moneda, cotizaciones: conversion.cotizaciones } : {}),
      seleccion: previa.viajes.filter(viaje => seleccion.has(viaje.clave)).map(({ clave, revision }) => ({ clave, revision })),
    };
    ejecutar(async () => {
      const recibo = await api.post(endpoint, entrada);
      setPrevia(null);
      setComprobante(recibo);
      setHistorial(actual => ({ items: [recibo, ...(actual?.items || [])], siguiente: actual?.siguiente || null }));
    });
  }

  function cambiarSeleccion(clave) {
    setSeleccion(actual => {
      const nueva = new Set(actual);
      if (nueva.has(clave)) nueva.delete(clave);
      else nueva.add(clave);
      return nueva;
    });
  }

  const saldosSeleccionados = { ARS: 0, CLP: 0, USD: 0 };
  for (const viaje of previa?.viajes || []) {
    if (seleccion.has(viaje.clave)) {
      for (const moneda of monedas) saldosSeleccionados[moneda] += viaje.saldos[moneda];
    }
  }

  const origenes = moneda ? monedas.filter(origen => origen !== moneda && saldosSeleccionados[origen] !== 0) : [];
  const requeridas = origenes.length ? [...new Set([...origenes, moneda])].filter(item => item !== "ARS") : [];
  const cotizaciones = Object.fromEntries(requeridas.map(item => [item, Number(tasas[item])]));
  const tasasValidas = requeridas.every(item => cotizaciones[item] > 0 && cotizaciones[item] <= 1_000_000_000);
  let conversion = null;
  if (moneda && tasasValidas && seleccion.size) {
    const total = origenes.reduce((acumulado, origen) => (
      acumulado + saldosSeleccionados[origen] * (cotizaciones[origen] ?? 1) / (cotizaciones[moneda] ?? 1)
    ), saldosSeleccionados[moneda]);
    const unidad = moneda === "CLP" ? 100 : 1;
    const redondeado = Math.sign(total) * Math.round(Math.abs(total) / unidad) * unidad;
    if (Number.isSafeInteger(redondeado)) conversion = { moneda, total: redondeado || 0, cotizaciones };
  }

  return (
    <main className="space-y-6 p-4">
      <Link href="/viajes" className="text-primary underline">Volver a viajes</Link>
      <h1 className="text-2xl font-semibold">Liquidación agrupada</h1>
      <form onSubmit={consultar}>
        <fieldset disabled={ocupado || !responsables} className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1">Salida desde
            <input className={inputStyle} type="date" name="desde" value={filtros.desde} max={filtros.hasta || undefined} onChange={cambiar} required />
          </label>
          <label className="grid gap-1">Salida hasta
            <input className={inputStyle} type="date" name="hasta" value={filtros.hasta} min={filtros.desde || undefined} onChange={cambiar} required />
          </label>
          <label className="grid gap-1">Tipo de responsable
            <select className={inputStyle} name="tipo" value={filtros.tipo} onChange={cambiar}>
              <option value="chofer">Chofer</option>
              <option value="fletero">Fletero</option>
            </select>
          </label>
          <label className="grid gap-1">Responsable
            <select className={inputStyle} name="responsableId" value={filtros.responsableId} onChange={cambiar} required>
              <option value="">Seleccionar</option>
              {responsables?.[filtros.tipo].map(persona => <option key={persona._id} value={persona._id}>{persona.nombre}</option>)}
            </select>
          </label>
          <Button native className={buttonStyle} type="submit">Consultar viajes</Button>
        </fieldset>
      </form>
      {ocupado && <p role="status">Procesando…</p>}
      {errorCarga && <p role="alert" className="text-danger">{errorCarga}</p>}
      {error && <p role="alert" className="text-danger">{error}</p>}
      {previa && (
        <section className="space-y-4 rounded-lg border border-divider p-4">
          <h2 className="text-lg font-semibold">Viajes finalizados pendientes de liquidar</h2>
          {previa.viajes.length ? (
            <>
              <p>Seleccioná los viajes que querés liquidar.</p>
              <fieldset disabled={ocupado} className="flex flex-wrap items-end gap-3">
                <label className="grid gap-1">Moneda de liquidación
                  <select className={inputStyle} value={moneda} onChange={evento => setMoneda(evento.target.value)}>
                    <option value="">Mantener monedas originales</option>
                    {Object.entries(etiquetasMoneda).map(([codigo, etiqueta]) => (
                      <option key={codigo} value={codigo}>{etiqueta}</option>
                    ))}
                  </select>
                </label>
                {requeridas.map(item => (
                  <label className="grid gap-1" key={item}>ARS por 1 {item}
                    <input className={inputStyle} type="number" min="0" max="1000000000" step="any"
                      value={tasas[item]} onChange={evento => setTasas(actual => ({ ...actual, [item]: evento.target.value }))} />
                  </label>
                ))}
              </fieldset>
              {moneda && seleccion.size > 0 && !conversion && (
                <p className="text-sm text-danger">
                  {tasasValidas ? "El saldo convertido excede el importe permitido." : "Ingresá una cotización mayor que cero para cada moneda indicada."}
                </p>
              )}
              <Detalle
                datos={{ ...previa, saldos: saldosSeleccionados, conversion }}
                seleccion={seleccion}
                cambiarSeleccion={cambiarSeleccion}
                seleccionarTodos={incluir => setSeleccion(new Set(incluir ? previa.viajes.map(viaje => viaje.clave) : []))}
                ocupado={ocupado}
              />
              <Button native className={buttonStyle} type="button" disabled={ocupado || !seleccion.size || Boolean(moneda && !conversion)} onClick={confirmar}>
                Confirmar liquidación ({seleccion.size})
              </Button>
            </>
          ) : <p>No hay viajes para liquidar con estos filtros.</p>}
        </section>
      )}
      {comprobante && (
        <section className="space-y-3 rounded-lg border border-divider p-4">
          <article className={styles.comprobante}>
            <h2 className="text-lg font-semibold">Comprobante de liquidación</h2>
            <p>N.º {comprobante._id} · {new Date(comprobante.createdAt).toLocaleString("es-AR")}</p>
            <Detalle datos={comprobante} />
          </article>
          <Button native className={buttonStyle} type="button" onClick={() => window.print()}>Imprimir comprobante</Button>
        </section>
      )}
      {historial && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Liquidaciones registradas</h2>
          {historial.items.length === 0 && <p>Todavía no hay liquidaciones.</p>}
          <ul className="space-y-2">
            {historial.items.map(item => (
              <li key={item._id}>
                <Button native className="text-primary underline" type="button" disabled={ocupado} onClick={() => ejecutar(async () => {
                  setPrevia(null);
                  setComprobante(await api.get(endpoint + "/" + item._id));
                })}>
                  {item.responsable} ({item.filtros.tipo}) · {item.filtros.desde} al {item.filtros.hasta} · N.º {item._id}
                </Button>
              </li>
            ))}
          </ul>
          {historial.siguiente && (
            <Button native className={buttonStyle} type="button" disabled={ocupado} onClick={() => ejecutar(async () => {
              const pagina = await api.get(endpoint + "?antes=" + historial.siguiente);
              setHistorial({ items: [...historial.items, ...pagina.items], siguiente: pagina.siguiente });
            })}>Ver anteriores</Button>
          )}
        </section>
      )}
    </main>
  );
}