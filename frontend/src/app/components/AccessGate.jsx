"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

export default function AccessGate({ children }) {
  const pathname = usePathname();
  const { user, permisos, loading } = useAuth();
  if (loading) return <p>Cargando permisos...</p>;
  const section = pathname.split("/")[1];
  if (!user?.activo || !permisos.includes(section === "balance" ? "facturacion" : section)) {
    return <p role="alert">{user?.activo === false ? "Tu usuario está inactivo." : "No tenés permisos para esta sección. Solicitá la asignación de un perfil."}</p>;
  }
  return children;
}
