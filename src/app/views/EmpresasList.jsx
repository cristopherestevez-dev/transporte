import CrudTable from "../components/ui/CrudTable/CrudTable";
import TabsWrapper from "../components/ui/TabsWrapper/TabsWrapper";
import { useState , useEffect } from "react";





export default function EmpresasYFleteros() {
  const [proveedores, setProveedores] = useState([]);
  const [fleteros, setFleteros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch('/db.json');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setProveedores(data.proveedores);
        setFleteros(data.fleteros);
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
          label: "Proveedores", // Cambiamos el contenido de esta pestaña para que use Fleteros
          content: (
            <CrudTable
              title="Proveedores" // Título actualizado a "Proveedores"
              key="fleteros-proveedores" // Key única para esta instancia
              data={proveedores}
              setData={setProveedores}
              columns={[
                { label: "Nombre", key: "nombre" },
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
                  type: "select", // Especificamos el tipo select
                  required: true,
                  options: [ // Opciones para el enum TipoFletero
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
          label: "Fleteros", // Esta pestaña ahora podría ser redundante o para una vista más detallada si la necesitas
          content: (
            <CrudTable
              title="Fleteros" // Cambiamos el título para distinguirla si se mantiene
              key="fleteros"
              data={fleteros}
              setData={setFleteros}
              columns={[
                { label: "Nombre", key: "nombre" },
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
