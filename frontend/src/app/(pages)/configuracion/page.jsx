"use client";

import { useState, useEffect } from "react";
import CrudTable from "@/app/components/ui/CrudTable/CrudTable";
import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/app/components/ui/Toast/Toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const perfilOptions = [
  { value: "operador_logistico", label: "Operador Logístico" },
  { value: "operador_administrativo", label: "Operador Administrativo" },
  { value: "operador_seguridad", label: "Operador de Seguridad" },
];

const permisosLabels = {
  dashboard: "Dashboard",
  camiones: "Camiones",
  viajes: "Viajes",
  choferes: "Choferes",
  cotizador: "Cotizador",
  empresas: "Empresas",
  facturacion: "Facturación",
  configuracion: "Configuración",
};

export default function ConfiguracionPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const { perfil: userPerfil } = useAuth();
  const toast = useToast();

  // Cargar usuarios
  useEffect(() => {
    async function fetchUsuarios() {
      try {
        const res = await fetch(`${API_URL}/usuarios`);
        if (!res.ok) throw new Error("Error cargando usuarios");
        const data = await res.json();
        setUsuarios(data.data || []);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error cargando usuarios");
      } finally {
        setLoading(false);
      }
    }
    fetchUsuarios();
  }, []);

  // Solo operador_seguridad puede acceder
  if (userPerfil && userPerfil !== "operador_seguridad") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-foreground/60">
          No tenés permisos para acceder a esta sección
        </p>
      </div>
    );
  }

  const columns = [
    { key: "email", label: "Email" },
    { key: "nombre", label: "Nombre" },
    {
      key: "perfil",
      label: "Perfil",
      render: (value) => {
        const option = perfilOptions.find((o) => o.value === value);
        return option?.label || "Sin asignar";
      },
    },
    {
      key: "permisos",
      label: "Permisos",
      render: (value) => {
        if (!value || value.length === 0) return "Sin permisos";
        return (
          value
            .map((p) => permisosLabels[p] || p)
            .slice(0, 3)
            .join(", ") + (value.length > 3 ? "..." : "")
        );
      },
    },
    {
      key: "activo",
      label: "Estado",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {value ? "Activo" : "Inactivo"}
        </span>
      ),
    },
  ];

  const formFields = [
    { key: "email", label: "Email", type: "email", required: true },
    { key: "nombre", label: "Nombre", type: "text", required: true },
    {
      key: "perfil",
      label: "Perfil",
      type: "select",
      options: perfilOptions,
      required: true,
    },
    {
      key: "activo",
      label: "Activo",
      type: "select",
      options: [
        { value: true, label: "Sí" },
        { value: false, label: "No" },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-content1 rounded-lg p-6 border border-divider">
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          Gestión de Usuarios y Permisos
        </h2>
        <p className="text-sm text-foreground/60 mb-6">
          Asigná perfiles a los usuarios que se registren con Google. Los
          permisos se asignan automáticamente según el perfil seleccionado.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {perfilOptions.map((perfil) => (
            <div
              key={perfil.value}
              className="p-4 rounded-lg bg-content2 border border-divider"
            >
              <h3 className="font-semibold text-foreground mb-2">
                {perfil.label}
              </h3>
              <div className="flex flex-wrap gap-1">
                {perfil.value === "operador_logistico" && (
                  <>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      Dashboard
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      Camiones
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      Viajes
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      Choferes
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      Cotizador
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      Empresas
                    </span>
                  </>
                )}
                {perfil.value === "operador_administrativo" && (
                  <>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Dashboard
                    </span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Cotizador
                    </span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Facturación
                    </span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Empresas
                    </span>
                  </>
                )}
                {perfil.value === "operador_seguridad" && (
                  <>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                      Dashboard
                    </span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                      Configuración
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <CrudTable
        title="Usuarios"
        data={usuarios}
        setData={setUsuarios}
        columns={columns}
        formFields={formFields}
        apiUrl={`${API_URL}/usuarios`}
      />
    </div>
  );
}
