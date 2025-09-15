import CrudTable from "../components/ui/CrudTable/CrudTable";
import TabsWrapper from "../components/ui/TabsWrapper/TabsWrapper";

export default function EmpresasYFleteros() {
  return (
    <TabsWrapper
      tabs={[
        {
          label: "Proveedores", // Cambiamos el contenido de esta pestaña para que use Fleteros
          content: (
            <CrudTable
              title="Proveedores" // Título actualizado a "Proveedores"
              key="fleteros-proveedores" // Key única para esta instancia
              apiUrl="http://localhost:3001/proveedores" // API para Fleteros
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
              apiUrl="http://localhost:3001/fleteros"
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
