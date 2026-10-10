"use client";

import { useState, useEffect } from "react";
import CrudTable from "@/app/components/ui/CrudTable/CrudTable";
import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/app/components/ui/Toast/Toast";


import api from "@/services/api";
import { perfilOptions } from "@/lib/perfiles";

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

export default function Configuracion() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const { perfil: userPerfil, actualizarSesion } = useAuth();
  const [profilePermissions, setProfilePermissions] = useState({});
  const [savedPermissions, setSavedPermissions] = useState({});
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [savingPerfil, setSavingPerfil] = useState(null);
  const [configError, setConfigError] = useState("");
  const toast = useToast();

  const loadConfig = async () => {
    setLoading(true); setConfigError("");
    try {
      const [users, config] = await Promise.all([api.get("/usuarios"), api.get("/usuarios/perfiles")]);
      setUsuarios(users || []);
      setProfilePermissions(config.perfiles);
      setSavedPermissions(config.perfiles);
      setAvailablePermissions(config.disponibles);
    } catch (error) { setConfigError(error.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadConfig(); }, []);

  const togglePermission = (perfil, permission, enabled) => {
    setProfilePermissions((previous) => ({ ...previous, [perfil]: enabled ? [...previous[perfil], permission] : previous[perfil].filter((value) => value !== permission) }));
  };
  const savePermissions = async (perfil) => {
    if (savingPerfil) return;
    setSavingPerfil(perfil); setConfigError("");
    try {
      const saved = await api.patch(`/usuarios/perfiles/${perfil}`, { permisos: profilePermissions[perfil] });
      setSavedPermissions((previous) => ({ ...previous, [perfil]: saved.permisos }));
      setProfilePermissions((previous) => ({ ...previous, [perfil]: saved.permisos }));
      toast.success("Permisos del perfil guardados");
      const users = await api.get("/usuarios");
      setUsuarios(users);
      await actualizarSesion();
    } catch (error) { setConfigError(error.message); toast.error(error.message); }
    finally { setSavingPerfil(null); }
  };

  // Solo operador_seguridad puede acceder
  if (userPerfil !== "operador_seguridad") {
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
      key: "perfiles",
      label: "Perfiles",
      render: (value, row) => {
        const assigned = value?.length ? value : row.perfil ? [row.perfil] : [];
        return assigned.map((perfil) => perfilOptions.find((option) => option.value === perfil)?.label || perfil).join(", ") || "Sin asignar";
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
      key: "perfiles",
      label: "Perfiles",
      render: ({ form, setForm }) => {
        const assigned = Array.isArray(form.perfiles) ? form.perfiles : form.perfil ? [form.perfil] : [];
        return <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground mb-2">Perfiles asignados</legend>
          {perfilOptions.map((option) => <label key={option.value} className="flex items-center gap-2 text-foreground">
            <input type="checkbox" checked={assigned.includes(option.value)} onChange={(event) => setForm({ ...form, perfiles: event.target.checked ? [...assigned, option.value] : assigned.filter((perfil) => perfil !== option.value) })} />
            {option.label}
          </label>)}
          <p className="text-xs text-default-500">Podés asignar varios perfiles. Sin perfiles, el usuario no tendrá acceso a las secciones.</p>
        </fieldset>;
      },
    },
    {
      key: "activo",
      label: "Estado",
      type: "switch",
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
          permisos se asignan automáticamente según los perfiles asignados. Cada usuario puede elegir su perfil activo desde el encabezado.
        </p>

        {configError && <p role="alert" className="text-danger mb-4">{configError}</p>}
        {!availablePermissions.length ? <button onClick={loadConfig} className="text-primary underline">Reintentar carga</button> : <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {perfilOptions.map((perfil) => {
            const selected = profilePermissions[perfil.value] || [];
            const dirty = JSON.stringify([...selected].sort()) !== JSON.stringify([...(savedPermissions[perfil.value] || [])].sort());
            return <fieldset key={perfil.value} className="p-4 rounded-[10px] bg-content2 border border-divider space-y-3" disabled={!!savingPerfil}>
              <legend className="font-semibold text-foreground px-1">{perfil.label}</legend>
              <div className="space-y-2">
                {availablePermissions.map((permission) => {
                  const required = perfil.value === "operador_seguridad" && permission === "configuracion";
                  return <label key={permission} className="flex items-center gap-2 text-sm text-foreground">
                    <input type="checkbox" className="h-4 w-4 accent-blue-500" checked={selected.includes(permission)} disabled={required} onChange={(event) => togglePermission(perfil.value, permission, event.target.checked)} />
                    {permisosLabels[permission] || permission}{permission === "facturacion" ? " y Balance" : ""}
                  </label>;
                })}
              </div>
              {perfil.value === "operador_seguridad" && <p className="text-xs text-default-500">Configuración permanece habilitada para administrar los perfiles.</p>}
              <button type="button" onClick={() => savePermissions(perfil.value)} disabled={!dirty || !!savingPerfil} className="px-3 py-2 rounded-[10px] bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                {savingPerfil === perfil.value ? "Guardando…" : "Guardar permisos"}
              </button>
            </fieldset>;
          })}
        </div>}
      </div>

      <CrudTable
        title="Usuarios"
        allowCreate={false}
        data={usuarios}
        setData={setUsuarios}
        columns={columns}
        formFields={formFields}
        apiUrl={`/api/backend/usuarios`}
      />
    </div>
  );
}
