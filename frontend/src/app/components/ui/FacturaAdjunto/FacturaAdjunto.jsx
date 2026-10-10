"use client";
import { useEffect, useRef, useState } from 'react';
import { Upload, Eye, Download, X, Loader2 } from 'lucide-react';
import api from '@/services/api';

export default function FacturaAdjunto({ item, onChange, tipo = 'factura' }) {
  const field = tipo === 'factura' ? 'archivoFactura' : 'archivoPago';
  const label = tipo === 'factura' ? 'factura' : 'comprobante de cobro o pago';
  const input = useRef(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [preview, setPreview] = useState(null);
  const [attachment, setAttachment] = useState(item[field]);
  useEffect(() => { setAttachment(item[field]); }, [item, field]);
  useEffect(() => () => { if (preview?.url) URL.revokeObjectURL(preview.url); }, [preview]);
  const endpoint = `/facturacion/${item.endpoint}/${item._id || item.id}/${tipo === 'factura' ? 'archivo' : 'comprobante'}`;
  const upload = async event => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    if (!['application/pdf', 'image/jpeg'].includes(file.type) || file.size > 5 * 1024 * 1024) { setError('Elegí un PDF o JPG de hasta 5 MB.'); return; }
    setBusy(true); setError('');
    try {
      const contenido = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(file); });
      const saved = await api.post(endpoint, { nombre: file.name, tipo: file.type, contenido });
      setAttachment(saved); onChange?.(saved);
    } catch (err) { setError(err.message || 'No se pudo cargar la factura.'); }
    finally { setBusy(false); }
  };
  const open = async download => {
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/backend${endpoint}`, { cache: 'no-store' });
      if (!response.ok) { const result = await response.json(); throw new Error(result.message || 'No se pudo abrir la factura.'); }
      const url = URL.createObjectURL(await response.blob());
      if (download) { const link = document.createElement('a'); link.href = url; link.download = attachment.nombre; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
      else setPreview({ url, tipo: attachment.tipo, nombre: attachment.nombre });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const button = 'p-2 rounded-[10px] text-primary hover:bg-primary/10 transition-colors disabled:opacity-40';
  return <div>
    <div className="flex items-center gap-1">
      <input ref={input} type="file" accept="application/pdf,image/jpeg,.pdf,.jpg,.jpeg" onChange={upload} className="hidden" />
      <button type="button" disabled={busy} onClick={() => input.current.click()} className={button} title={attachment?.nombre ? `Reemplazar ${attachment.nombre}` : `Cargar ${label} PDF o JPG`} aria-label={`Cargar ${label} PDF o JPG`}>{busy ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}</button>
      {attachment?.nombre && <><button type="button" disabled={busy} onClick={() => open(false)} className={button} title={`Ver ${attachment.nombre}`} aria-label={`Ver ${label} adjunto`}><Eye size={18} /></button><button type="button" disabled={busy} onClick={() => open(true)} className={button} title={`Descargar ${attachment.nombre}`} aria-label={`Descargar ${label} adjunto`}><Download size={18} /></button></>}
    </div>
    {error && <p role="alert" className="text-xs text-danger max-w-56 whitespace-normal">{error}</p>}
    {preview && <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={() => setPreview(null)}><section role="dialog" aria-modal="true" aria-label="Factura adjunta" className="bg-content1 rounded-xl w-full max-w-5xl h-[85vh] flex flex-col shadow-xl" onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape') setPreview(null); }}><header className="flex items-center justify-between gap-3 p-4 border-b border-divider"><p className="font-semibold truncate">{preview.nombre}</p><button type="button" autoFocus className={button} aria-label="Cerrar factura" onClick={() => setPreview(null)}><X size={20} /></button></header>{preview.tipo === 'application/pdf' ? <iframe title={preview.nombre} src={preview.url} className="w-full flex-1 rounded-b-xl" /> : <div className="flex-1 overflow-auto p-4"><img src={preview.url} alt={preview.nombre} className="max-w-full mx-auto" /></div>}</section></div>}
  </div>;
}
