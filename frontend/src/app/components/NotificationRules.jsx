"use client";
import { useEffect, useState } from 'react';
import api from '@/services/api';
import { useToast } from '@/app/components/ui/Toast/Toast';

const field = 'w-full p-2 rounded-lg bg-content2 border border-divider';
const button = 'px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50';
export default function NotificationRules({ profiles }) {
  const toast = useToast();
  const [rules, setRules] = useState([]), [events, setEvents] = useState([]);
  const [pending, setPending] = useState(0), [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function load() {
    try {
      const data = await api.get('/notifications/rules');
      setRules(data.rules); setEvents(data.events); setPending(data.mobilePending); setError('');
    } catch (error) { setError(error.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  async function save(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (form._id) await api.put(`/notifications/rules/${form._id}`, form);
      else await api.post('/notifications/rules', form);
      setForm(null); await load(); toast.success('Regla de notificación guardada');
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  async function remove(rule) {
    if (!window.confirm(`¿Eliminar la regla "${rule.name}"? Dejará de generar alertas.`)) return;
    setBusy(true);
    try { await api.delete(`/notifications/rules/${rule._id}`); await load(); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  const option = events.find(event => event.type === form?.type);
  const availableEvents = events;
  return <div className="space-y-4">
    <p className="text-sm text-default-500">Administrá las reglas automáticas de tu empresa. Los destinatarios deben tener permiso para la vista; cada usuario conserva sus preferencias por perfil.</p>
    <p className="text-xs text-default-500">El canal móvil prepara entregas para las futuras apps. El envío al celular estará disponible al conectar los dispositivos y el servicio push. Entregas pendientes: {pending}.</p>
    {error && <p role="alert" className="text-danger">{error} <button className="underline" onClick={load}>Reintentar</button></p>}
    {loading ? <p role="status">Cargando reglas…</p> : <>
      <button className={button} disabled={busy || !availableEvents.length} onClick={() => { const first = availableEvents[0]; setForm({ name: first.label, type: first.type, profiles: [], allProfiles: false, channels: ['web'], active: true }); }}>Nueva regla</button>
      {!availableEvents.length && <p className="text-xs text-default-500">Todos los eventos disponibles tienen una regla. Podés editarla o eliminarla.</p>}
      {form && <form onSubmit={save} className="p-4 rounded-xl border border-divider space-y-4">
        <h2 className="font-semibold">{form._id ? 'Editar regla' : 'Nueva regla'}</h2>
        <label className="block text-sm">Nombre<input required maxLength={100} className={field} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
        <label className="block text-sm">Evento<select className={field} disabled={!!form._id} value={form.type} onChange={event => setForm({ ...form, type: event.target.value, profiles: [] })}>{(form._id ? events : availableEvents).map(event => <option key={event.type} value={event.type}>{event.label}</option>)}</select></label>
        <fieldset className="space-y-2"><legend className="font-medium text-sm">Perfiles destinatarios</legend><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={!!form.allProfiles} onChange={event => setForm({ ...form, allProfiles: event.target.checked })} />Todos los perfiles</label>{profiles.filter(profile => profile.activo).map(profile => <label key={profile.perfil} className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={form.allProfiles} checked={form.allProfiles || form.profiles.includes(profile.perfil)} onChange={event => setForm({ ...form, profiles: event.target.checked ? [...form.profiles, profile.perfil] : form.profiles.filter(code => code !== profile.perfil) })} />{profile.nombre}</label>)}</fieldset>
        <fieldset><legend className="font-medium text-sm">Canales</legend>{[['web', 'Campana de la aplicación'], ['mobile', 'Celular (pendiente de integración)']].map(([channel, label]) => <label key={channel} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.channels.includes(channel)} onChange={event => setForm({ ...form, channels: event.target.checked ? [...form.channels, channel] : form.channels.filter(value => value !== channel) })} />{label}</label>)}</fieldset>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={event => setForm({ ...form, active: event.target.checked })} />Regla activa</label>
        <div className="flex gap-3"><button className={button} disabled={busy || (!form.allProfiles && !form.profiles.length) || !form.channels.length}>{busy ? 'Guardando…' : 'Guardar'}</button><button type="button" disabled={busy} onClick={() => setForm(null)}>Cancelar</button></div>
      </form>}
      <div className="grid md:grid-cols-2 gap-4">{rules.map(rule => <article key={rule._id} className="p-4 rounded-xl border border-divider space-y-2">
        <h2 className="font-semibold">{rule.name}</h2><p className="text-sm text-default-500">{events.find(event => event.type === rule.type)?.label}</p>
        <p className="text-sm">Perfiles: {rule.allProfiles ? 'Todos los perfiles' : rule.profiles.map(code => profiles.find(profile => profile.perfil === code)?.nombre || code).join(', ') || 'Sin destinatarios'}</p>
        <p className="text-sm">{rule.active ? 'Activa' : 'Eliminada'} · {rule.channels.map(channel => channel === 'web' ? 'Web' : 'Móvil pendiente').join(', ')}</p>
        <div className="flex gap-3"><button disabled={busy} className={button} onClick={() => setForm({ ...rule })}>Editar</button>{rule.active && <button disabled={busy} className="px-3 py-2 rounded-lg bg-danger text-danger-foreground hover:opacity-90 text-sm disabled:opacity-50" onClick={() => remove(rule)}>Eliminar</button>}</div>
      </article>)}</div>
    </>}
  </div>;
}
