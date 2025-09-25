"use client";

import CrudTable from "../components/ui/CrudTable/CrudTable";
import TabsWrapper from "../components/ui/TabsWrapper/TabsWrapper";
import { useState , useEffect } from "react";





export default function ChoferesList() {
  const [choferes, setChoferes] = useState([]);
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
        setChoferes(data.choferes);
        
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
          label: "Choferes", // Cambiamos el contenido de esta pestaña para que use Fleteros
          content: (
            <CrudTable
              title="Choferes" // Título actualizado a "Proveedores"
              key="choferes" // Key única para esta instancia
              data={choferes}
              setData={setChoferes}
              columns={[
                { label: "Nombre", key: "nombre" },
                { label: "DNI", key: "dni" },    
                { label: "Teléfono", key: "telefono" },
                { label: "Vencimiento Licencia", key: "licencia" },

                
              ]}
              formFields={[
                { label: "Nombre", key: "nombre", required: true },
                { label: "CUIL/CUIT", key: "cuil_cuit", required: true },
                { label: "Teléfono", key: "telefono" },
                {label: "Vencimiento Licencia", key: "licencia", type: "date" , required: true},
               
              ]}
            />
          ),
        },
     
      ]}
    />
  );
}
