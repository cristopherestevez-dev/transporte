"use client";
import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { firstAllowedRoute, isCompanySuspended } from '@/lib/access.mjs';
export default function ServicioSuspendido() {
  const { user, logout, actualizarSesion } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const refresh = async () => {
    setBusy(true); setError('');
    try {
      const session = await actualizarSesion();
      if (session?.user?.activo && !isCompanySuspended(session.user)) window.location.assign(firstAllowedRoute(session.user.permisos));
    } catch { setError('No se pudo consultar el estado. Intentá nuevamente.'); }
    finally { setBusy(false); }
  };
  return <main className="min-h-[70vh] flex items-center justify-center p-6 bg-background text-foreground"><section className="max-w-lg w-full rounded-2xl border border-divider bg-content1 p-8 space-y-5"><ShieldAlert size={36} className="text-warning" /><h1 className="text-2xl font-semibold">Servicio suspendido</h1>{user?.empresaNombre && <p className="font-medium">{user.empresaNombre}</p>}<p className="text-default-500">El acceso de tu empresa fue suspendido por la administración de la plataforma. Contactá al administrador de tu empresa para regularizar el servicio.</p><p className="text-sm text-default-500">Podrás volver a operar cuando se habilite nuevamente.</p>{error && <p role="alert" className="text-danger">{error}</p>}<div className="flex flex-wrap gap-4"><button onClick={refresh} disabled={busy} className="rounded-[10px] px-4 py-2 bg-primary text-primary-foreground disabled:opacity-50">{busy ? 'Consultando…' : 'Consultar estado'}</button><button onClick={logout} className="text-default-500 underline">Cerrar sesión</button></div></section></main>;
}
