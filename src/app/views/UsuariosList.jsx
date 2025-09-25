"use client";
import { useEffect, useState } from "react";
import CrudTable from "../components/ui/CrudTable/CrudTable";

export default function UsuariosList() {
  const [usuarios, setUsuarios] = useState([]);
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
        setUsuarios(data.users);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);


  if (loading) return <p>Cargando usuarios...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
     <CrudTable
        title="Usuarios"
        key="usuarios"
        data={usuarios}
        setData={setUsuarios}
        columns={[
          { label: "ID", key: "id" },
          { label: "Nombre", key: "name" },
          { label: "Email", key: "email" },
          { label: "Rol", key: "rol" },
        ]}
        formFields={[
          { label: "Nombre", key: "name", required: true },
          { label: "Email", key: "email", type: "email", required: true },
          { label: "Rol", key: "rol", required: true },
          
        ]}
      />
    </div>
  );
}
