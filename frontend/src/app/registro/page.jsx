"use client";
import { useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import api from "@/services/api";

export default function Registro() {
  const { user, loading, logout, actualizarSesion } = useAuth();
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const send = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try { await api.post("/usuarios/mi-solicitud", { codigo }); await actualizarSesion(); }
    catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };
  return <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
    <section className="w-full max-w-md bg-content1 border border-divider rounded-2xl p-6 space-y-4">
      <h1 className="text-xl font-semibold">Vincular tu cuenta a una empresa</h1>
      {loading ? <p>Cargando…</p> : <>
        <p className="text-default-500">{user?.name} · {user?.email}</p>
        {user?.estado === "rechazado" ? <p>Tu solicitud fue rechazada o tu cuenta fue desactivada. Contactá al administrador de tu empresa.</p> : user?.empresaId ? <>
          <p>Empresa: <strong>{user.empresaNombre}</strong></p>
          <p>Tu solicitud está pendiente de aprobación. El administrador de la empresa debe aceptarte y asignarte un perfil.</p>
          <button onClick={async () => { const session = await actualizarSesion(); if (session?.user?.activo) window.location.assign("/dashboard"); }} className="text-primary underline">Consultar aprobación</button>
        </> : <form onSubmit={send} className="space-y-4">
          <p className="text-sm text-default-500">Pedí el código de empresa a su administrador. Tu cuenta quedará pendiente hasta que te acepte.</p>
          <label className="grid gap-1 text-sm">Código de empresa<input required value={codigo} onChange={(event) => setCodigo(event.target.value)} className="bg-content2 border-0 rounded-[10px] px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-focus/40" /></label>
          <button disabled={saving} className="w-full bg-primary text-primary-foreground rounded-[10px] px-3 py-2 disabled:opacity-50">{saving ? "Enviando…" : "Solicitar acceso"}</button>
        </form>}
        {error && <p role="alert" className="text-danger">{error}</p>}
        <button onClick={logout} className="text-default-500 text-sm underline">Cerrar sesión</button>
      </>}
    </section>
  </main>;
}
