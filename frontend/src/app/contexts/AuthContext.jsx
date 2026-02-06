"use client";

import { createContext, useContext } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { data: session, status } = useSession();

  const loading = status === "loading";
  const authenticated = status === "authenticated";

  const user = session?.user || null;
  const permisos = user?.permisos || [];
  const perfil = user?.perfil || null;

  // Verificar si tiene permiso para una ruta específica
  const tienePermiso = (ruta) => {
    if (!permisos.length) return false;
    // Normalizar ruta (quitar /)
    const rutaNormalizada = ruta.replace(/^\//, "");
    return permisos.includes(rutaNormalizada);
  };

  const login = () => signIn("google");
  const logout = () => signOut({ callbackUrl: "/" });

  return (
    <AuthContext.Provider
      value={{
        user,
        perfil,
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
