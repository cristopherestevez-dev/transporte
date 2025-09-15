"use client";
import UsuariosList from "@/app/views/UsuariosList";

export default function UsuariosPage() {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Usuarios</h1>
        {/* Aquí irán los componentes para listar o crear empresas */}
        <UsuariosList />
      </div>
    );
  }
  