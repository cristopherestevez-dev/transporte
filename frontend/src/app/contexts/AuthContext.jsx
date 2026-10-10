"use client";

import { createContext, useContext } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { data: session, status, update } = useSession();

  const loading = status === "loading";
  const authenticated = status === "authenticated";

  const user = session?.user || null;
  const permisos = user?.permisos || [];
  const perfil = user?.perfil || null;
  const perfiles = user?.perfiles || [];

  const cambiarPerfil = async (selected) => {
    if (selected === perfil) return;
    if (!perfiles.includes(selected)) throw new Error("Este perfil no está asignado a tu usuario");
    const refreshed = await update({ perfil: selected });
    if (refreshed?.user?.perfil !== selected || !refreshed.user.activo) throw new Error("No se pudo activar el perfil. Actualizá la sesión e intentá nuevamente.");
    const section = window.location.pathname.split("/")[1];
    const permission = section === "balance" ? "facturacion" : section;
    const destination = refreshed.user.permisos.includes(permission) ? window.location.pathname + window.location.search : refreshed.user.permisos[0] ? `/${refreshed.user.permisos[0]}` : "/dashboard";
    window.location.assign(destination);
  };

  // Verificar si tiene permiso para una ruta específica
  const tienePermiso = (ruta) => {
    if (!permisos.length) return false;
    // Normalizar ruta (quitar /)
    const rutaNormalizada = ruta.replace(/^\//, "");
    return permisos.includes(rutaNormalizada);
  };

  const login = () => signIn("google");
  const logout = () => signOut({ callbackUrl: "/landing" });

  return (
    <AuthContext.Provider
      value={{
        user,
        perfil,
        perfiles,
        cambiarPerfil,
        actualizarSesion: update,
        permisos,
        loading,
        authenticated,
        tienePermiso,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
