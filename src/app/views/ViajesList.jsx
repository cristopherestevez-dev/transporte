"use client";
import React, { useState, useEffect } from "react";
import TabsWrapper from "../components/ui/TabsWrapper/TabsWrapper";
import CrudTable from "../components/ui/CrudTable/CrudTable";
import ProveedorWrapper from "../components/ui/ModalWrapper/ProveedorWrapper";
import { apiFetch } from "@/app/utils/api";

const ViajesList = () => {
  const [proveedoresOptions, setProveedoresOptions] = useState([]);
  const [loadingProveedores, setLoadingProveedores] = useState(true);

  const [proveedorModalOpen, setProveedorModalOpen] = useState(false);
  const [currentRowEditing, setCurrentRowEditing] = useState(null);

  const [dataNacionales, setDataNacionales] = useState([]);
  const [dataInternacionales, setDataInternacionales] = useState([]);

  useEffect(() => {
    
    async function fetchProveedores() {
      try {
        const res = await fetch("http://localhost:3001/proveedores");
        if (!res.ok) throw new Error("Error al cargar proveedores");
        const data = await res.json();
        
        setProveedoresOptions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProveedores(false);
      }
      
    }
    

    async function fetchViajes() {
      try {
        const jsonNac = await apiFetch("http://localhost:3001/viajesNacionales");
        const jsonInt = await apiFetch("http://localhost:3001/viajesInternacionales");
        setDataNacionales(jsonNac);
        setDataInternacionales(jsonInt);
      } catch (err) {
        console.error(err);
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

    currentRowEditing.proveedorId = prov.id;
    currentRowEditing.proveedorNombre = prov.nombre;

    // Actualiza el estado para forzar re-render
    if (dataNacionales.includes(currentRowEditing)) {
      setDataNacionales([...dataNacionales]);
    } else if (dataInternacionales.includes(currentRowEditing)) {
      setDataInternacionales([...dataInternacionales]);
    }

    setProveedorModalOpen(false);
    setCurrentRowEditing(null);
  };

  if (loadingProveedores) return <p>Cargando proveedores...</p>;

  return (
    <>
      <TabsWrapper
        tabs={[
          {
            label: "Nacionales",
            content: (
              <CrudTable
                title="Viajes Nacionales"
                data={dataNacionales}
                setData={setDataNacionales}
                columns={[
                  { label: "Origen", key: "origen" },
                  { label: "Destino", key: "destino" },
                  { label: "Fecha Salida", key: "fecha_salida" },
                  { label: "Fecha Llegada", key: "fecha_llegada" },
                  { label: "Estado", key: "estado" },
                  { label: "Proveedor", key: "proveedor" },
                ]}
                formFields={[
                  { label: "Origen", key: "origen", required: true },
                  { label: "Destino", key: "destino", required: true },
                  { label: "Fecha Salida", key: "fecha_salida", type: "date" },
                  { label: "Fecha Llegada", key: "fecha_llegada", type: "date" },
                  {
                    label: "Estado",
                    key: "estado",
                    type: "select",
                    required: true,
                    options: [
                      { value: "pendiente", label: "Pendiente" },
                      { value: "en_transito", label: "En Tránsito" },
                      { value: "finalizado", label: "Finalizado" },
                    ],
                  },
                  { label: "Proveedor", key: "proveedor", type: "button" },
                ]}
                openProveedorModal={openProveedorModal}
              />
            ),
          },
          {
            label: "Internacionales",
            content: (
              <CrudTable
                title="Viajes Internacionales"
                data={dataInternacionales}
                setData={setDataInternacionales}
                columns={[
                  { label: "Origen", key: "origen" },
                  { label: "Destino", key: "destino" },
                  { label: "País Origen", key: "pais_origen" },
                  { label: "País Destino", key: "pais_destino" },
                  { label: "Fecha Salida", key: "fecha_inicio" },
                  { label: "Fecha Llegada", key: "fecha_fin" },
                  { label: "Estado", key: "estado" },
                  { label: "Proveedor", key: "proveedor" },
                ]}
                formFields={[
                  { label: "Origen", key: "origen", required: true },
                  { label: "Destino", key: "destino", required: true },
                  { label: "País Origen", key: "pais_origen", required: true },
                  { label: "País Destino", key: "pais_destino", required: true },
                  { label: "Fecha Salida", key: "fecha_inicio", type: "date" },
                  { label: "Fecha Llegada", key: "fecha_fin", type: "date" },
                  {
                    label: "Estado",
                    key: "estado",
                    type: "select",
                    required: true,
                    options: [
                      { value: "pendiente", label: "Pendiente" },
                      { value: "en_transito", label: "En Tránsito" },
                      { value: "finalizado", label: "Finalizado" },
                    ],
                  },
                  { label: "Proveedor", key: "proveedor", type: "button" },
                ]}
                openProveedorModal={openProveedorModal}
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




