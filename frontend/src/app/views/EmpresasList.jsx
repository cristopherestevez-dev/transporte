import CrudTable from "../components/ui/CrudTable/CrudTable";
import TabsWrapper from "../components/ui/TabsWrapper/TabsWrapper";
import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/services/api";


export default function EmpresasYFleteros() {
  const [proveedores, setProveedores] = useState([]);
  const [fleteros, setFleteros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [proveedoresData, fleterosData] = await Promise.all([
          api.getPage('/proveedores').then(result => result.data),
          api.getPage('/fleteros').then(result => result.data),
        ]);
        setProveedores(proveedoresData || []);
        setFleteros(fleterosData || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <p>Cargando datos...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <TabsWrapper
      tabs={[
        {
          label: "Proveedores",
          content: (
            <CrudTable
              title="Proveedores"
              key="fleteros-proveedores"
              data={proveedores}
              setData={setProveedores}
              apiUrl={`/api/backend/proveedores`}
              columns={[
                {
                  label: "Nombre",
                  key: "nombre",
                  render: (value, row) => (
                    <Link
                      href={`/empresas/${row._id || row.id}`}
                      className="text-blue-600 hover:underline font-bold"
                    >
                      {value}
                    </Link>
                  ),
                },
                { label: "CUIL/CUIT", key: "cuil_cuit" },
                { label: "Tipo", key: "tipo" },
                { label: "Dirección", key: "direccion" },
                { label: "Teléfono", key: "telefono" },
                { label: "Email", key: "email" },
              ]}
              formFields={[
                { label: "Nombre", key: "nombre", required: true },
                { label: "CUIL/CUIT", key: "cuil_cuit", required: true },
                {
                  label: "Tipo",
                  key: "tipo",
                  type: "select",
                  required: true,
                  options: [
                    { value: "PERSONA_FISICA", label: "Persona Física" },
                    { value: "EMPRESA", label: "Empresa" },
                  ],
                },
                { label: "Dirección", key: "direccion" },
                { label: "Teléfono", key: "telefono" },
                { label: "Email", key: "email" },
              ]}
            />
          ),
        },
        {
          label: "Fleteros",
          content: (
            <CrudTable
              title="Fleteros"
              key="fleteros"
              data={fleteros}
              setData={setFleteros}
              apiUrl={`/api/backend/fleteros`}
              columns={[
                { label: "Nombre", key: "nombre", render: (value, row) => <Link href={`/empresas/fleteros/${row._id || row.id}`} className="text-blue-600 hover:underline font-bold">{value}</Link> },
                { label: "CUIL/CUIT", key: "cuil_cuit" },
                { label: "Tipo", key: "tipo" },
                { label: "Dirección", key: "direccion" },
                { label: "Teléfono", key: "telefono" },
                { label: "Email", key: "email" },
              ]}
              formFields={[
                { label: "Nombre", key: "nombre", required: true },
                { label: "CUIL/CUIT", key: "cuil_cuit", required: true },
                {
                  label: "Tipo",
                  key: "tipo",
                  type: "select",
                  required: true,
                  options: [
                    { value: "PERSONA_FISICA", label: "Persona Física" },
                    { value: "EMPRESA", label: "Empresa" },
                  ],
                },
                { label: "Dirección", key: "direccion" },
                { label: "Teléfono", key: "telefono" },
                { label: "Email", key: "email" },
              ]}
            />
          ),
        },
      ]}
    />
  );
}
