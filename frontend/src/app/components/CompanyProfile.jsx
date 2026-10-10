"use client";
import { useRef, useState } from 'react';
import { Building2, Upload } from 'lucide-react';
import useCompanyProfile from '@/hooks/useCompanyProfile';
import api from '@/services/api';

export default function CompanyProfile() {
  const { profile, error: loadError } = useCompanyProfile();
  const input = useRef(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const upload = async event => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 10 * 1024 * 1024) { setError('Elegí una imagen PNG o JPG de hasta 10 MB.'); return; }
    setBusy(true); setError('');
    try {
      const bitmap = await createImageBitmap(file);
      try {
        const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        await api.patch('/usuarios/empresa/perfil', { logo: canvas.toDataURL('image/png') });
      } finally { bitmap.close(); }
      window.dispatchEvent(new Event('company-logo-changed'));
    } catch (err) { setError(err.message || 'No se pudo cargar el logo.'); }
    finally { setBusy(false); }
  };
  return <section className="bg-content1 border border-divider rounded-xl p-4"><h2 className="font-semibold mb-4">Perfil de la empresa</h2><div className="flex flex-wrap items-center gap-4">{profile?.logo ? <img src={profile.logo} alt={`Logo de ${profile.nombre}`} className="w-24 h-24 object-contain rounded-[10px] bg-white p-2 border border-divider" /> : <div className="w-24 h-24 rounded-[10px] bg-content2 flex items-center justify-center text-default-400"><Building2 size={32} /></div>}<div className="space-y-2"><p className="font-medium">{profile?.nombre || 'Tu empresa'}</p>{profile?.codigo && <p className="text-sm text-default-500">Código de ingreso: {profile.codigo}</p>}<input ref={input} type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" onChange={upload} className="hidden" /><button type="button" disabled={busy} onClick={() => input.current.click()} className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-primary text-primary-foreground text-sm disabled:opacity-50"><Upload size={16} />{busy ? 'Guardando…' : profile?.logo ? 'Cambiar logo' : 'Cargar logo'}</button><p className="text-xs text-default-500">El logo se muestra en el perfil y en las nuevas órdenes de pago. PNG o JPG; se adapta automáticamente.</p></div></div>{(error || loadError) && <p role="alert" className="text-danger text-sm mt-3">{error || loadError}</p>}</section>;
}
