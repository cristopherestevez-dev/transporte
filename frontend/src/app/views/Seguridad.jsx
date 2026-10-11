"use client";
import { useState, useEffect } from 'react';
import CrudTable from '@/app/components/ui/CrudTable/CrudTable';
import AppSelect from '@/app/components/ui/AppSelect/AppSelect';
import TabsWrapper from '@/app/components/ui/TabsWrapper/TabsWrapper';
import { useAuth } from '@/app/contexts/AuthContext';
import { useToast } from '@/app/components/ui/Toast/Toast';
import api from '@/services/api';
import CompanyProfile from '@/app/components/CompanyProfile';
import NotificationRules from '@/app/components/NotificationRules';
const labels = { dashboard: 'Dashboard', camiones: 'Camiones', viajes: 'Viajes', choferes: 'Choferes', cotizador: 'Cotizador', empresas: 'Proveedores y fleteros', facturacion: 'Facturación y balance', configuracion: 'Seguridad', 'mis-viajes': 'Mis viajes', 'mi-camion': 'Mi camión y servicios' };
const input = 'w-full px-3 py-2 rounded-[10px] bg-content2 text-foreground border border-divider outline-none focus:ring-2 focus:ring-primary/40';
const button = 'px-3 py-2 rounded-[10px] bg-primary text-primary-foreground text-sm disabled:opacity-50';
function DriverField({ form, setForm }) {
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    let current = true; setDrivers([]); setError('');
    if (form.empresaId) api.get(`/usuarios/choferes-empresa?empresaId=${encodeURIComponent(form.empresaId)}`).then(data => { if (current) setDrivers(data); }).catch(err => { if (current) setError(err.message); });
    return () => { current = false; };
  }, [form.empresaId]);
  return <div className="space-y-2"><p className="text-sm font-medium">Ficha de chofer vinculada</p><AppSelect ariaLabel="Ficha de chofer vinculada" value={form.choferId || 'none'} onChange={value => setForm({ ...form, choferId: value === 'none' ? '' : value })} options={[{ value: 'none', label: 'Seleccionar ficha de chofer' }, ...drivers.map(d => ({ value: d._id, label: `${d.nombre} · ${d.dni || ''}` }))]} disabled={!form.empresaId} /><p className="text-xs text-default-500">Asigná el camión a esta ficha desde Choferes.</p>{!drivers.length && form.empresaId && !error && <p className="text-xs text-default-500">Creá primero la ficha en Choferes de esta empresa.</p>}{error && <p className="text-danger text-xs">{error}</p>}</div>;
}
export default function Seguridad() {
  const { perfil, user, actualizarSesion } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]), [companies, setCompanies] = useState([]), [profiles, setProfiles] = useState([]), [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [newProfile, setNewProfile] = useState({ perfil: '', nombre: '', permisos: [] });
  const [newCompany, setNewCompany] = useState({ nombre: '', codigo: '' });
  const [legacyCompany, setLegacyCompany] = useState(''), [legacy, setLegacy] = useState(null);
  const globalAdmin = perfil === 'superadmin';
  async function load() {
    setLoading(true); setError('');
    try {
      const [u, p, c] = await Promise.all([api.getPage('/usuarios', globalAdmin ? { perfil: 'operador_seguridad' } : {}).then(result => result.data), api.get('/usuarios/perfiles'), api.get('/usuarios/empresas-operadoras')]);
      setUsers(u); setProfiles(p.definiciones); setAvailable(p.disponibles); setCompanies(c);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  async function action(task, message) {
    if (busy) return;
    setBusy(true); setError('');
    try { await task(); toast.success(message); await load(); await actualizarSesion(); }
    catch (err) { setError(err.message); toast.error(err.message); } finally { setBusy(false); }
  }
  const companyOptions = companies.map(c => ({ value: c._id, label: `${c.nombre} · ${c.codigo}` }));
  const fields = [
    { key: 'usuario', label: 'Usuario', render: ({ form, setForm }) => <label className="block text-sm">Usuario{!form._id ? ' *' : ''}<input required={!form._id} minLength={3} maxLength={64} pattern="[a-zA-Z0-9][a-zA-Z0-9._-]*" autoComplete="off" value={form.usuario || ''} onChange={e => setForm({ ...form, usuario: e.target.value })} className={input} /><span className="text-xs text-default-500">Ingresá con este usuario y contraseña. No requiere email.</span></label> },
    { key: 'nombre', label: 'Nombre', required: true },
    { key: 'email', label: 'Email', render: ({ form, setForm }) => <label className="block text-sm">Email (opcional)<input type="email" readOnly={!!form._id} value={form.email?.endsWith('@usuarios.invalid') ? '' : form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className={input} /></label> },
    { key: 'password', render: ({ form, setForm }) => !form._id && <label className="block text-sm">Contraseña<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} className={input} /><span className="text-xs text-default-500">Mínimo 8 caracteres.</span></label> },
    { key: 'empresaId', required: true, render: ({ form, setForm }) => <div className="space-y-2"><p className="text-sm font-medium">Empresa operadora</p><AppSelect ariaLabel="Empresa operadora" value={form.empresaId} onChange={value => setForm({ ...form, empresaId: value, choferId: '' })} options={companyOptions} /></div> },
    { key: 'perfiles', render: ({ form, setForm }) => {
      const assigned = Array.isArray(form.perfiles) ? form.perfiles : form.perfil ? [form.perfil] : [];
      return <fieldset className="space-y-2"><legend className="font-medium text-sm mb-2">Perfiles asignados</legend>{profiles.filter(p => p.activo && p.perfil !== 'superadmin' && (!globalAdmin || p.perfil === 'operador_seguridad')).map(p => <label key={p.perfil} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={assigned.includes(p.perfil)} onChange={e => setForm({ ...form, perfiles: e.target.checked ? [...assigned, p.perfil] : assigned.filter(v => v !== p.perfil) })} />{p.nombre}</label>)}</fieldset>;
    } },
    { key: 'choferId', render: props => props.form.perfiles?.includes('chofer') ? <DriverField {...props} /> : null },
    { key: 'estado', render: ({ form, setForm }) => <AppSelect label="Aprobación" value={form.estado} onChange={value => setForm({ ...form, estado: value })} options={[{ value: 'pendiente', label: 'Pendiente' }, { value: 'aprobado', label: 'Aprobado' }, { value: 'rechazado', label: 'Rechazado' }]} /> },
    { key: 'activo', label: 'Cuenta activa', type: 'switch' },
  ];
  const permissions = (p, change) => <div className="grid sm:grid-cols-2 gap-2">{available.filter(v => p.perfil !== 'chofer' || ['mis-viajes', 'mi-camion'].includes(v)).map(v => <label key={v} className="text-sm flex items-center gap-2"><input type="checkbox" disabled={busy || (p.perfil === 'operador_seguridad' && v === 'configuracion')} checked={p.permisos.includes(v)} onChange={e => change({ ...p, permisos: e.target.checked ? [...p.permisos, v] : p.permisos.filter(i => i !== v) })} />{labels[v]}</label>)}</div>;
  if (!['operador_seguridad', 'superadmin'].includes(perfil)) return <p className="p-6">Seleccioná el perfil de Seguridad para administrar usuarios y perfiles.</p>;
  if (loading) return <p className="p-6">Cargando Seguridad…</p>;
  return <div className="space-y-5"><h1 className="text-xl font-semibold">{globalAdmin ? 'Administración de la plataforma' : 'Seguridad de empresa'}</h1>{error && <p role="alert" className="text-danger">{error} <button onClick={load} className="underline">Reintentar</button></p>}{!globalAdmin && <CompanyProfile />}<TabsWrapper tabs={[
    { label: globalAdmin ? 'Administradores de empresas' : 'Usuarios', content: <div className="space-y-4"><p className="text-sm text-default-500">Creá cuentas con contraseña o aprobá solicitudes de Google. Asigná Operador de Seguridad al administrador de cada empresa.</p><CrudTable title="Usuarios" data={globalAdmin ? users.filter(u => (u.perfiles || [u.perfil]).includes('operador_seguridad')) : users} setData={changed => { if (globalAdmin) setUsers([...users.filter(u => !(u.perfiles || [u.perfil]).includes('operador_seguridad')), ...changed]); else setUsers(changed); }} apiUrl="/api/backend/usuarios" columns={[
      { key: 'nombre', label: 'Nombre' }, { key: 'usuario', label: 'Usuario' }, { key: 'email', label: 'Email', render: value => value?.endsWith('@usuarios.invalid') ? '—' : value || '—' }, { key: 'empresaId', label: 'Empresa', render: v => companies.find(c => c._id === v)?.nombre || 'Sin vincular' }, { key: 'perfiles', label: 'Perfiles', render: (v, row) => (v?.length ? v : row.perfil ? [row.perfil] : []).map(code => profiles.find(p => p.perfil === code)?.nombre || code).join(', ') || 'Sin asignar' }, { key: 'estado', label: 'Aprobación' }, { key: 'activo', label: 'Cuenta', render: v => v ? 'Activa' : 'Inactiva' },
    ]} formFields={fields} listFilters={globalAdmin ? { perfil: 'operador_seguridad' } : {}} defaultValues={{ activo: true, estado: 'aprobado', perfiles: globalAdmin ? ['operador_seguridad'] : [], empresaId: user?.empresaId || '' }} validate={form => {
      if (!form.empresaId) return 'Seleccioná una empresa';
      if (!form._id && !/^[a-z0-9][a-z0-9._-]{2,63}$/i.test(form.usuario || '')) return 'Ingresá un usuario de al menos 3 caracteres, sin espacios';
      if (!form._id && (!form.password || form.password.length < 8)) return 'La contraseña debe tener al menos 8 caracteres';
      if (form.estado === 'aprobado' && !form.perfiles?.length) return 'Asigná al menos un perfil';
      if (form.perfiles?.includes('chofer') && !form.choferId) return 'Vinculá la cuenta con su ficha de chofer';
      return null;
    }} /></div> },
    { label: 'Perfiles y permisos', content: <div className="space-y-5"><p className="text-sm text-default-500">Los permisos se administran por empresa. Chofer accede exclusivamente a sus viajes y camión.</p><form className="p-4 rounded-xl bg-content1 border border-divider space-y-3" onSubmit={e => { e.preventDefault(); action(async () => { await api.post('/usuarios/perfiles', newProfile); setNewProfile({ perfil: '', nombre: '', permisos: [] }); }, 'Perfil creado'); }}><h2 className="font-semibold">Nuevo perfil</h2><input aria-label="Nombre del perfil" required maxLength={100} placeholder="Nombre del perfil" value={newProfile.nombre} onChange={e => setNewProfile({ ...newProfile, nombre: e.target.value })} className={input} /><input aria-label="Código del perfil" required pattern="[a-z][a-z0-9_]{1,63}" placeholder="Código: supervisor" value={newProfile.perfil} onChange={e => setNewProfile({ ...newProfile, perfil: e.target.value })} className={input} />{permissions(newProfile, setNewProfile)}<button disabled={busy} className={button}>Crear perfil</button></form>
      <div className="grid md:grid-cols-2 gap-4">{profiles.map(p => <div key={p.perfil} className="p-4 rounded-xl bg-content1 border border-divider space-y-3"><input aria-label={`Nombre de ${p.perfil}`} disabled={!p.activo} value={p.nombre} className={input} onChange={e => setProfiles(profiles.map(i => i.perfil === p.perfil ? { ...p, nombre: e.target.value } : i))} /><p className="text-xs text-default-500">{p.perfil}{!p.activo ? ' · Eliminado' : ''}</p>{p.activo && <>{permissions(p, changed => setProfiles(profiles.map(i => i.perfil === p.perfil ? changed : i)))}<div className="flex gap-3"><button disabled={busy} className={button} onClick={() => action(() => api.patch(`/usuarios/perfiles/${p.perfil}`, { nombre: p.nombre, permisos: p.permisos }), 'Perfil actualizado')}>Guardar</button>{p.perfil !== 'operador_seguridad' && <button disabled={busy} className="px-3 py-2 rounded-lg bg-danger text-danger-foreground hover:opacity-90 text-sm disabled:opacity-50" onClick={() => { if (window.confirm(`¿Eliminar ${p.nombre}? Primero quitá el perfil de sus usuarios.`)) action(() => api.delete(`/usuarios/perfiles/${p.perfil}`), 'Perfil eliminado'); }}>Eliminar</button>}</div></>}</div>)}</div>
    </div> },
    { label: 'Empresas operadoras', content: <div className="space-y-5">{globalAdmin && <form className="p-4 bg-content1 border border-divider rounded-xl space-y-3" onSubmit={e => { e.preventDefault(); action(async () => { await api.post('/usuarios/empresas-operadoras', newCompany); setNewCompany({ nombre: '', codigo: '' }); }, 'Empresa creada. Asigná su administrador desde Usuarios.'); }}><h2 className="font-semibold">Nueva empresa operadora</h2><input aria-label="Nombre de empresa" placeholder="Nombre de empresa" required value={newCompany.nombre} onChange={e => setNewCompany({ ...newCompany, nombre: e.target.value })} className={input} /><input aria-label="Código de empresa" placeholder="Código de ingreso: transporte-sur" required pattern="[a-z0-9][a-z0-9-]{2,49}" value={newCompany.codigo} onChange={e => setNewCompany({ ...newCompany, codigo: e.target.value })} className={input} /><button disabled={busy} className={button}>Crear empresa</button></form>}
      <div className="grid md:grid-cols-2 gap-4">{companies.map(c => <article key={c._id} className="p-4 bg-content1 border border-divider rounded-xl"><h2 className="font-semibold">{c.nombre}</h2><p className="text-sm text-default-500">Código para solicitar ingreso: <strong>{c.codigo}</strong></p><p className="text-sm mt-2">Administradores: {users.filter(u => u.empresaId === c._id && u.activo && (u.perfiles || [u.perfil]).includes('operador_seguridad')).map(u => u.nombre || u.email).join(', ') || 'Pendiente de asignar en Administradores'}</p><p className="text-sm my-3">{c.activo ? 'Habilitada para operar' : 'Operación deshabilitada'}</p>{globalAdmin && <button disabled={busy} className={c.activo ? 'px-3 py-2 rounded-[10px] bg-danger/10 text-danger text-sm' : button} onClick={() => { if (!c.activo || window.confirm(`¿Suspender ${c.nombre}? Sus usuarios quedarán bloqueados para operar.`)) action(() => api.patch(`/usuarios/empresas-operadoras/${c._id}`, { activo: !c.activo }), c.activo ? 'Empresa suspendida' : 'Empresa habilitada'); }}>{c.activo ? 'Suspender empresa' : c.estado === 'pendiente' ? 'Aceptar y habilitar' : 'Habilitar empresa'}</button>}</article>)}</div>
      {globalAdmin && <div className="p-4 bg-content1 border border-divider rounded-xl space-y-3"><h2 className="font-semibold">Vincular datos anteriores</h2><p className="text-sm text-default-500">Revisá los registros creados antes de separar las empresas y asignales su empresa.</p><AppSelect label="Empresa destinataria" options={companyOptions} value={legacyCompany} onChange={v => { setLegacyCompany(v); setLegacy(null); }} /><button disabled={!legacyCompany || busy} className={button} onClick={async () => { try { setLegacy(await api.get(`/usuarios/empresas-operadoras/${legacyCompany}/datos-anteriores`)); } catch (err) { setError(err.message); } }}>Revisar registros</button>{legacy && <><ul className="text-sm">{Object.entries(legacy).map(([key, count]) => <li key={key}>{key}: {count}</li>)}</ul><button disabled={busy || !Object.values(legacy).some(Boolean)} className={button} onClick={() => { if (window.confirm('¿Vincular todos estos registros a la empresa seleccionada?')) action(async () => { await api.post(`/usuarios/empresas-operadoras/${legacyCompany}/datos-anteriores`, {}); setLegacy(null); }, 'Registros vinculados'); }}>Confirmar vinculación</button></>}</div>}
    </div> },
    ...(!globalAdmin ? [{ label: 'Notificaciones', content: <NotificationRules profiles={profiles} /> }] : []),
  ].filter((tab, index) => globalAdmin ? index !== 1 : index !== 2)} /></div>;
}
