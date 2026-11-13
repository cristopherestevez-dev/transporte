"use client";

import { idViaje } from "@/lib/idViaje";
import MesPlanilla from "@/app/components/ui/MesPlanilla";
import Button from "@/app/components/ui/Button/button";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import TabsWrapper from "../components/ui/TabsWrapper/TabsWrapper";
import CrudTable from "../components/ui/CrudTable/CrudTable";
import ProveedorWrapper from "../components/ui/ModalWrapper/ProveedorWrapper";
import api from "@/services/api";
import { useAuth } from "@/app/contexts/AuthContext";
import TripInvoicePayment from "./TripInvoicePayment";
import SelectSearch from "../components/ui/SelectSearch/Select";
import SearchableSelect from "../components/ui/SearchableSelect/SearchableSelect";


const tiposFactura = [
  { value: "", label: "Sin factura" },
  { value: "factura_a", label: "Factura A" },
  { value: "factura_b", label: "Factura B" },
  { value: "factura_c", label: "Factura C" },
  { value: "factura_e", label: "Factura E" },
];

// Definimos los estados y sus colores
const estados = [
  { value: "pendiente", label: "Pendiente", color: "text-yellow-500" },
  { value: "en_transito", label: "En Tránsito", color: "text-blue-500" },
  { value: "finalizado", label: "Finalizado", color: "text-green-500" },
  { value: "cancelado", label: "Cancelado", color: "text-red-500" },
];

// Componente para el combo de estado
const EstadoSelect = ({ value, onChange }) => {
  const options = estados.map((e) => ({
    label: e.label,
    value: e.value,
    color: e.color,
  }));
  const selectedOption = options.find((opt) => opt.value === value) || options[0];
  return (
    <SelectSearch
      options={options}
      selectedOption={selectedOption}
      onOptionChange={(opt) => onChange(opt.value)}
      className={`h-8 font-semibold border-divider ${selectedOption.color || ""}`}
      width="150px"
    />
  );
};

const validateDates = (form) => {
  const { fecha_salida, fecha_llegada } = form;
  if (!fecha_salida || !fecha_llegada) return null;
  
  if (new Date(fecha_salida) > new Date(fecha_llegada)) {
    return "La fecha de salida no puede ser mayor que la fecha de llegada.";
  }
  return null;
};

const ViajesList = () => {
  const { tienePermiso } = useAuth();
  const [proveedoresOptions, setProveedoresOptions] = useState([]);
  const [choferesOptions, setChoferesOptions] = useState([]);
  const [fleterosOptions, setFleterosOptions] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [flota, setFlota] = useState({ camiones: [], semirremolques: [] });
  const [loadingProveedores, setLoadingProveedores] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [proveedorModalOpen, setProveedorModalOpen] = useState(false);
  const [currentRowEditing, setCurrentRowEditing] = useState(null);

  const [nacionales, setNacionales] = useState([]);
  const [internacionales, setInternacionales] = useState([]);

  useEffect(() => {
    async function fetchProveedores() {
      try {
        const [proveedores, choferes, fleteros, flotaDisponible, operadoresDisponibles] = await Promise.all([
          api.getProveedores(),
          api.getChoferes(),
          api.getFleteros(),
          api.get('/viajes/flota'),
          api.get('/viajes/operadores')
        ]);
        setProveedoresOptions(proveedores || []);
        setChoferesOptions(choferes || []);
        setFleterosOptions(fleteros || []);
        setFlota(flotaDisponible);
        setOperadores(operadoresDisponibles);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProveedores(false);
      }
    }

    async function fetchViajes() {
      try {
        setLoading(true);
        const [viajesNac, viajesInt] = await Promise.all([
          api.getPage('/viajes/nacionales').then(result => result.data),
          api.getPage('/viajes/internacionales').then(result => result.data)
        ]);
        setNacionales(viajesNac || []);
        setInternacionales(viajesInt || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProveedores();
    fetchViajes();
  }, []);

  const openProveedorModal = (row) => {
    setCurrentRowEditing(row);
    setProveedorModalOpen(true);
  };

  const handleSelectProveedor = (prov) => {
    if (!currentRowEditing) return;

    const updatedRow = {
      ...currentRowEditing,
      proveedorId: prov._id,
      proveedorNombre: prov.nombre,
    };

    const newData =
      currentRowEditing.type === "nacional"
        ? nacionales.map((row) =>
            row._id === currentRowEditing._id ? updatedRow : row
          )
        : internacionales.map((row) =>
            row._id === currentRowEditing._id ? updatedRow : row
          );

    if (currentRowEditing.type === "nacional") setNacionales(newData);
    else setInternacionales(newData);

    setProveedorModalOpen(false);
    setCurrentRowEditing(null);
  };

  if (loadingProveedores) return <p>Cargando proveedores...</p>;
  if (loading) return <p>Cargando viajes...</p>;
  if (error) return <p>Error: {error}</p>;

  // Columnas de la tabla
  const columns = [
    { label: "ID", key: "numeroOperativo" },
    { label: "Origen", key: "origen" },
    { label: "Destino", key: "destino" },
    { label: "Fecha Salida", key: "fecha_salida" },
    { label: "Fecha Llegada", key: "fecha_llegada" },
    { 
        label: "Realizado Por", 
        key: "asignadoId",
        render: (value, row) => {
            if (row.tipoAsignacion === 'chofer') {
                const c = choferesOptions.find(opt => opt._id?.toString() === value?.toString());
                return c ? c.nombre : '-';
            }
            if (row.tipoAsignacion === 'fletero') {
                const f = fleterosOptions.find(opt => opt._id?.toString() === value?.toString());
                return f ? f.nombre : '-';
            }
            return '-';
        }
    },
    { label: "Carga / Contenedor", key: "carga" },
    { label: "Patente camión", key: "camionPatente", render: value => value || "—" },
    { label: "Operador logístico", key: "operadorLogisticoId", render: value => value ? operadores.find(item => item.id === value)?.nombre || "Operador asignado" : "Sin asignar" },
    { label: "Patente semi", key: "semirremolquePatente", render: value => value || "—" },
    { label: "Número de factura", key: "numero_comprobante", render: (value) => value || "-" },
    {
      label: "Tipo de factura",
      key: "tipo_comprobante",
      render: (value) => tiposFactura.find((tipo) => tipo.value === value)?.label || value || "-",
    },
    {
      label: "Estado",
      key: "estado",
      render: (value, row, setRowData) => (
        <EstadoSelect
          value={value}
          onChange={(newEstado) => {
            const updatedRow = { ...row, estado: newEstado };
            setRowData(updatedRow);
          }}
        />
      ),
    },
    { label: "Proveedor", key: "proveedor" },
  ];

  // Campos del formulario
  const formFields = [
    { label: "Origen", key: "origen", required: true },
    { label: "Destino", key: "destino", required: true },
    { label: "Número de factura", key: "numero_comprobante" },
    { label: "Tipo de factura", key: "tipo_comprobante", type: "select", options: tiposFactura },
    { label: "Fecha Salida", key: "fecha_salida", type: "date" },
    {
      label: "Mes de la planilla",
      key: "mesPlanilla",
      render: ({ form, setForm, editingItem }) => (
        <MesPlanilla value={form.mesPlanilla} onChange={mesPlanilla => setForm({ ...form, mesPlanilla })}
          fechaOriginal={editingItem ? editingItem.fecha_salida || "" : undefined} />
      ),
    },
    { 
      label: "Fecha Llegada", 
      key: "fecha_llegada", 
      type: "date",
      minDateFrom: "fecha_salida" 
    },
    {
        label: "Tipo de Carga",
        key: "tipoCarga",
        render: ({ form, setForm }) => (
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Carga</label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                        <input 
                            type="radio" 
                            name="tipoCarga" 
                            value="contenedor" 
                            checked={form.tipoCarga === "contenedor" || (!form.tipoCarga && form.carga && form.carga !== "ByL")}
                            onChange={() => setForm({ ...form, tipoCarga: "contenedor", carga: form.carga === "ByL" ? "" : form.carga })}
                        />
                        Contenedor
                    </label>
                    <label className="flex items-center gap-2">
                        <input 
                            type="radio" 
                            name="tipoCarga" 
                            value="byl" 
                            checked={form.tipoCarga === "byl" || (!form.tipoCarga && form.carga === "ByL")}
                            onChange={() => setForm({ ...form, tipoCarga: "byl", carga: "ByL" })}
                        />
                        Baranda y Lona
                    </label>
                </div>
                {(form.tipoCarga === "contenedor" || (!form.tipoCarga && form.carga && form.carga !== "ByL")) && (
                    <div className="mt-2">
                         <label className="block text-sm font-medium text-gray-700">N° Contenedor</label>
                         <input 
                            type="text"
                            className="w-full mt-1 p-2 border rounded-md"
                            placeholder="Ej: MSCU1234567"
                            value={form.carga || ""}
                            onChange={(e) => setForm({ ...form, carga: e.target.value })}
                         />
                    </div>
                )}
            </div>
        )
    },
    {
      label: "Estado",
      key: "estado",
      type: "select",
      required: true,
      options: estados.map((e) => ({ value: e.value, label: e.label })),
    },
    {
      label: "Proveedor",
      key: "proveedor",
      render: ({ form, setForm }) => {
        const options = proveedoresOptions.map((opt) => ({
          label: opt.nombre,
          value: opt._id,
        }));
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
            <SearchableSelect
              options={options}
              value={form.proveedorId}
              onChange={(val) => {
                const selectedOption = proveedoresOptions.find(opt => opt._id?.toString() === val?.toString());
                setForm({
                  ...form,
                  proveedorId: val,
                  proveedor: selectedOption ? selectedOption.nombre : "",
                });
              }}
              placeholder="Seleccionar Proveedor..."
              className="w-full"
            />
          </div>
        );
      }
    },
    {
      label: "Asignación",
      key: "asignacion",
      render: ({ form, setForm }) => {
        const tipoAsignacion = form.tipoAsignacion || "ninguno";
        
        return (
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Asignación</label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tipoAsignacion"
                    value="chofer"
                    checked={tipoAsignacion === "chofer"}
                    onChange={(e) => {
                      setForm({ ...form, tipoAsignacion: "chofer", asignadoId: "", camionPatente: "" });
                    }}
                  />
                  Chofer
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tipoAsignacion"
                    value="fletero"
                    checked={tipoAsignacion === "fletero"}
                    onChange={(e) => {
                      setForm({ ...form, tipoAsignacion: "fletero", asignadoId: "", camionPatente: "" });
                    }}
                  />
                  Fletero
                </label>
              </div>
            </div>

            {tipoAsignacion !== "ninguno" && (
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seleccionar {tipoAsignacion === "chofer" ? "Chofer" : "Fletero"}
                 </label>
                 {(() => {
                   const options = (tipoAsignacion === "chofer" ? choferesOptions : fleterosOptions).map((opt) => ({
                     label: opt.nombre,
                     value: opt._id,
                   }));
                   return (
                     <SearchableSelect
                       options={options}
                       value={form.asignadoId}
                       onChange={(val) => {
                         setForm({
                           ...form,
                           asignadoId: val,
                           camionPatente: val === form.asignadoId ? form.camionPatente : "",
                         });
                       }}
                       placeholder={`Seleccionar ${tipoAsignacion === "chofer" ? "Chofer" : "Fletero"}...`}
                       className="w-full"
                     />
                   );
                 })()}
              </div>
            )}
          </div>
        );
      }
    },
    {
      label: "Operador logístico",
      key: "operadorLogisticoId",
      render: ({ form, setForm }) => {
        const options = operadores.map(({ id, nombre }) => ({ value: id, label: nombre }));
        if (form.operadorLogisticoId && !options.some(item => item.value === form.operadorLogisticoId)) {
          options.push({ value: form.operadorLogisticoId, label: "Operador asignado" });
        }
        return (
          <div className="space-y-1">
            <span className="text-sm">Operador logístico</span>
            <SearchableSelect
              options={[{ value: "sin-operador", label: "Sin asignar" }, ...options]}
              value={form.operadorLogisticoId || "sin-operador"}
              onChange={value => setForm({ ...form, operadorLogisticoId: value === "sin-operador" ? "" : value })}
              placeholder="Seleccionar operador"
            />
          </div>
        );
      },
    },
    {
      label: "Camión asignado",
      key: "camionId",
      render: ({ form }) => {
        if (form.tipoAsignacion !== "chofer" || !form.asignadoId) return null;
        const driver = choferesOptions.find(item => item._id === form.asignadoId);
        const truck = flota.camiones.find(item => item._id === driver?.camionId);
        return <p className="text-sm">Camión asignado · {form.camionPatente || truck?.patente || "Sin camión asignado"}</p>;
      },
    },
    {
      label: "Semirremolque",
      key: "semirremolqueId",
      render: ({ form, setForm }) => {
        const options = flota.semirremolques.map(item => ({ value: item._id, label: item.patente }));
        if (form.semirremolqueId && !options.some(item => item.value === form.semirremolqueId)) {
          options.push({ value: form.semirremolqueId, label: form.semirremolquePatente || "Semi guardado" });
        }
        return (
          <div className="space-y-1">
            <span className="text-sm">Semirremolque</span>
            <SearchableSelect
              options={[{ value: "sin-semi", label: "Sin semirremolque" }, ...options]}
              value={form.semirremolqueId || "sin-semi"}
              onChange={value => setForm({ ...form, semirremolqueId: value === "sin-semi" ? "" : value })}
              placeholder="Seleccionar por patente"
            />
          </div>
        );
      },
    },
  ];

  const renderTripTabs = (direccion) => {
    const received = direccion === "recibida";
    const belongs = (row) => (row.direccion_facturacion || "emitida") === direccion;
    const fields = received
      ? formFields.filter((field) => field.key !== "asignacion").map((field) =>
          field.key === "proveedor" ? { ...field, label: "Empresa / Fletero que factura", render: ({ form, setForm }) => (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Empresa / Fletero que factura</label>
              <SearchableSelect
                options={[
                  ...proveedoresOptions.map((item) => ({ label: item.nombre, value: `empresa:${item._id}` })),
                  ...fleterosOptions.map((item) => ({ label: item.nombre, value: `fletero:${item._id}` })),
                ]}
                value={form.tipoAsignacion === "fletero" ? `fletero:${form.asignadoId}` : form.proveedorId ? `empresa:${form.proveedorId}` : ""}
                onChange={(value) => {
                  const [kind, id] = value.split(":");
                  const selected = (kind === "fletero" ? fleterosOptions : proveedoresOptions).find((item) => item._id === id);
                  setForm({ ...form, proveedor: selected?.nombre || "", proveedorId: kind === "empresa" ? id : "", tipoAsignacion: kind === "fletero" ? "fletero" : "ninguno", asignadoId: kind === "fletero" ? id : "" });
                }}
                placeholder="Seleccionar empresa o fletero..."
              />
            </div>
          ) } : field)
      : formFields;
    const visibleColumns = received
      ? columns.filter((column) => column.key !== "asignadoId").map((column) => column.key === "proveedor" ? { ...column, label: "Empresa / Fletero que factura" } : column)
      : columns;
    return (
      <TabsWrapper key={direccion} tabs={[
        { label: "Nacionales", rows: nacionales, setter: setNacionales, endpoint: "nacionales", type: "nacional" },
        { label: "Internacionales", rows: internacionales, setter: setInternacionales, endpoint: "internacionales", type: "internacional" },
      ].map(({ label, rows, setter, endpoint, type }) => ({
        label,
        content: <CrudTable
          key={`${direccion}:${endpoint}`}
          title={`Viajes ${label.toLowerCase()} — ${received ? "facturas recibidas" : "facturas emitidas"}`}
          data={rows.filter(belongs)}
          setData={(updated) => setter((previous) => [...previous.filter((row) => !belongs(row)), ...updated])}
          apiUrl={`/api/backend/viajes/${endpoint}`}
          listFilters={{ direccion_facturacion: direccion }}
          columnFilters={visibleColumns.filter(column => column.key !== "numeroOperativo").map(({ key, label }) => ({
            key: `viaje_${key}`,
            label,
            type: key.startsWith("fecha_") ? "date" : undefined,
            options: {
              estado: estados,
              operadorLogisticoId: [
                { value: "sin-operador", label: "Sin asignar" },
                ...operadores.map(({ id, nombre }) => ({ value: id, label: nombre })),
              ],
              tipo_comprobante: tiposFactura.map((option) => ({ ...option, value: option.value || "sin_factura" })),
              asignadoId: [
                ...choferesOptions.map(({ _id, nombre }) => ({ value: `chofer:${_id}`, label: `${nombre} (Chofer)` })),
                ...fleterosOptions.map(({ _id, nombre }) => ({ value: `fletero:${_id}`, label: `${nombre} (Fletero)` })),
              ],
            }[key],
          }))}
          horizontalScroll
          columns={visibleColumns.map(column => column.key === "numeroOperativo" ? { ...column, render: value => idViaje(value, type) } : column)}
          formFields={fields}
          defaultValues={{ direccion_facturacion: direccion }}
          extraActions={(trip) => (
            <div className="flex flex-wrap items-center gap-2">
              {received && tienePermiso("facturacion") && <TripInvoicePayment trip={trip} scope={endpoint} />}
            <Link
              href={"/viajes/" + type + "/" + encodeURIComponent(trip._id || trip.id) + "?desde=viajes"}
              aria-label="Ver detalles del viaje"
              title="Ver detalles del viaje"
              className="inline-flex text-default-500 transition-colors hover:text-primary"
            >
              <Eye size={20} aria-hidden="true" />
            </Link>
            </div>
          )}
          validate={validateDates}
        />,
      }))} />
    );
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button as={Link} href="/viajes/liquidaciones" color="primary">Liquidación agrupada</Button>
      </div>
      <TabsWrapper
        tabs={[
          { label: "Viajes que facturamos", content: renderTripTabs("emitida") },
          { label: "Viajes que nos facturan", content: renderTripTabs("recibida") },
        ]}
      />

      {/* Modal proveedores */}
      <ProveedorWrapper
        isOpen={proveedorModalOpen}
        onClose={() => setProveedorModalOpen(false)}
        proveedores={proveedoresOptions}
        onSelect={handleSelectProveedor}
      />
    </>
  );
};

export default ViajesList;
