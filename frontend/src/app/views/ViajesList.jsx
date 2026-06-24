"use client";

import React, { useState, useEffect } from "react";
import TabsWrapper from "../components/ui/TabsWrapper/TabsWrapper";
import CrudTable from "../components/ui/CrudTable/CrudTable";
import ProveedorWrapper from "../components/ui/ModalWrapper/ProveedorWrapper";
import api from "@/services/api";
import SelectSearch from "../components/ui/SelectSearch/Select";
import SearchableSelect from "../components/ui/SearchableSelect/SearchableSelect";

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
  const [proveedoresOptions, setProveedoresOptions] = useState([]);
  const [choferesOptions, setChoferesOptions] = useState([]);
  const [fleterosOptions, setFleterosOptions] = useState([]);
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
        const [proveedores, choferes, fleteros] = await Promise.all([
          api.getProveedores(),
          api.getChoferes(),
          api.getFleteros()
        ]);
        setProveedoresOptions(proveedores || []);
        setChoferesOptions(choferes || []);
        setFleterosOptions(fleteros || []);
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
          api.getViajesNacionales(),
          api.getViajesInternacionales()
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
    { label: "Fecha Salida", key: "fecha_salida", type: "date" },
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
                      setForm({ ...form, tipoAsignacion: "chofer", asignadoId: "" });
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
                      setForm({ ...form, tipoAsignacion: "fletero", asignadoId: "" });
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
  ];

  return (
    <>
      <TabsWrapper
        tabs={[
          {
            label: "Nacionales",
            content: (
              <CrudTable
                title="Viajes Nacionales"
                data={nacionales}
                setData={setNacionales}
                apiUrl="http://localhost:3001/api/viajes/nacionales"
                columns={columns}
                formFields={formFields}
                openProveedorModal={(row) =>
                  openProveedorModal({ ...row, type: "nacional" })
                }
                validate={validateDates}
              />
            ),
          },
          {
            label: "Internacionales",
            content: (
              <CrudTable
                title="Viajes Internacionales"
                data={internacionales}
                setData={setInternacionales}
                apiUrl="http://localhost:3001/api/viajes/internacionales"
                columns={columns}
                formFields={formFields}
                openProveedorModal={(row) =>
                  openProveedorModal({ ...row, type: "internacional" })
                }
                validate={validateDates}
              />
            ),
          },
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
