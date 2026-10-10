"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { permissionForPath, isCompanySuspended } from "@/lib/access.mjs";
import ServicioSuspendido from './ServicioSuspendido';

export default function AccessGate({ children }) {
  const pathname = usePathname();
  const { user, permisos, loading } = useAuth();
  if (loading) return <p>Cargando permisos...</p>;
  if (isCompanySuspended(user)) return <ServicioSuspendido />;
  const section = pathname.split("/")[1];
  if (!user?.activo || (section !== 'sin-acceso' && !permisos.includes(permissionForPath(pathname)))) {
    return <p role="alert">{user?.activo === false ? "Tu usuario está inactivo." : "No tenés permisos para esta sección. Solicitá la asignación de un perfil."}</p>;
  }
  return children;
}
