"use client";
import { useEffect, useState } from "react";
import CrudTable from "../components/ui/CrudTable/CrudTable";
import api from "@/services/api";

export default function UsuariosList() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


   useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await api.getUsers();
        setUsuarios(data || []);
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
        apiUrl="http://localhost:3001/api/users"
        columns={[
          { label: "ID", key: "_id" },
          { label: "Nombre", key: "name" },
          { label: "Email", key: "email" },
          { label: "Rol", key: "role" },
        ]}
        formFields={[
          { label: "Nombre", key: "name", required: true },
          { label: "Email", key: "email", type: "email", required: true },
          { label: "Rol", key: "role", required: true },
          
        ]}
      />
    </div>
  );
}
