"use client";
import { useEffect, useRef, useState } from 'react';
import { FileDown, Download, Eye, Plus, Trash2 } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import jsPDF from 'jspdf';
import api from '@/services/api';
import AppSelect from '../AppSelect/AppSelect';

function Firma({ onChange }) {
  const canvas = useRef(null), drawing = useRef(false), ink = useRef(false);
  const position = event => {
    const rect = canvas.current.getBoundingClientRect();
    return [(event.clientX - rect.left) * canvas.current.width / rect.width, (event.clientY - rect.top) * canvas.current.height / rect.height];
  };
  const end = () => { if (drawing.current) { drawing.current = false; onChange(ink.current ? canvas.current.toDataURL('image/png') : ''); } };
  return <div><p className="text-sm font-medium mb-2">Firma del autorizante</p><canvas ref={canvas} width={600} height={180} aria-label="Dibujá tu firma con el mouse o el dedo" className="w-full h-44 bg-white border border-divider rounded-[10px] touch-none" onPointerDown={event => { const ctx = canvas.current.getContext('2d'); drawing.current = true; canvas.current.setPointerCapture(event.pointerId); ctx.strokeStyle = '#172033'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...position(event)); }} onPointerMove={event => { if (!drawing.current) return; ink.current = true; const ctx = canvas.current.getContext('2d'); ctx.lineTo(...position(event)); ctx.stroke(); }} onPointerUp={end} onPointerCancel={end} /><button type="button" className="text-sm text-primary mt-2" onClick={() => { canvas.current.getContext('2d').clearRect(0, 0, 600, 180); ink.current = false; onChange(''); }}>Limpiar firma</button></div>;
}

export default function ComprobanteOperacion({ item, onChange }) {
  const payment = item.endpoint.startsWith('pagos');
  const finalState = payment ? 'pagado' : 'cobrado';
  const completed = ['pagado', 'cobrado'].includes(item.estado);
  const [mode, setMode] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [form, setForm] = useState({}), [signature, setSignature] = useState('');
  const [preview, setPreview] = useState(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const viewOrder = async () => {
    setBusy(true); setError('');
    try {
      if (!item.orden_pago_url?.startsWith('data:application/pdf;base64,')) throw new Error('No se pudo visualizar el PDF de esta orden de pago.');
      const response = await fetch(item.orden_pago_url);
      setPreview(URL.createObjectURL(await response.blob()));
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const endpoint = `/facturacion/${item.endpoint}/${item._id || item.id}`;
  const remaining = Math.round((item.monto - (item.monto_pagado || 0)) * 100) / 100;
  const open = (action, target) => { setError(''); setSignature(''); setForm({ monto: remaining, metodo: 'transferencia', fecha: new Date().toLocaleDateString('en-CA'), nombre: '', dni: '', cheques: [{ numero: '', monto: remaining, vencimiento: '' }], target }); setMode(action); };
  const changeState = async value => {
    if (value === item.estado) return;
    if ([finalState, 'pago_parcial'].includes(value)) { open('movimiento', value); return; }
    setBusy(true); setError('');
    try { onChange(await api.patch(endpoint, { estado: value })); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (mode === 'movimiento') {
        const monto = Number(form.monto);
        if (!(monto > 0) || monto > remaining) throw new Error('Ingresá un monto mayor a cero que no supere el saldo pendiente.');
        if (form.target === finalState && Math.abs(monto - remaining) > 0.005) throw new Error('Para finalizar la factura registrá todo el saldo pendiente. Para un importe menor, elegí pago/cobro parcial.');
        const cheques = form.metodo === 'cheque' ? form.cheques.map(cheque => ({ numero: cheque.numero.trim(), monto: Number(cheque.monto), vencimiento: cheque.vencimiento })) : [];
        if (form.metodo === 'cheque' && (!cheques.length || cheques.some(cheque => !cheque.numero || !(cheque.monto > 0) || !cheque.vencimiento) || Math.abs(cheques.reduce((sum, cheque) => sum + cheque.monto, 0) - monto) > 0.005)) throw new Error('Completá número, vencimiento e importe de cada cheque. La suma debe coincidir con el importe del movimiento.');
        const historial_pagos = [...(item.historial_pagos || []), { fecha: form.fecha, monto, metodos_pago: { [form.metodo]: { enabled: true, monto } }, cheques }];
        onChange(await api.patch(endpoint, { historial_pagos }));
      } else {
        if (!signature || !form.nombre.trim() || !/^\d{7,8}$/.test(form.dni || '')) throw new Error('Completá el nombre, un DNI de 7 u 8 dígitos y dibujá la firma.');
        const company = await api.get('/usuarios/empresa/perfil');
        const doc = new jsPDF();
        doc.setTextColor(23, 32, 51); doc.setFontSize(22); doc.text('Orden de pago', 20, 25);
        doc.setFontSize(11);
        const companyLines = doc.splitTextToSize(company.nombre, 125); doc.text(companyLines, 20, 36);
        if (company.logo) {
          const dimensions = doc.getImageProperties(company.logo);
          const scale = Math.min(35 / dimensions.width, 28 / dimensions.height);
          doc.addImage(company.logo, dimensions.fileType, 155, 12, dimensions.width * scale, dimensions.height * scale);
        }
        const fields = [['Fecha de emisión', form.fecha], ['Beneficiario', item.razon_social], ['CUIT', item.cuit], ['Factura', item.numero_comprobante], ['Moneda', item.moneda || 'Sin definir'], ['Importe de la factura', Number(item.monto).toLocaleString('es-AR')], ['Pagado acumulado', Number(item.monto_pagado || 0).toLocaleString('es-AR')], ['Saldo pendiente', (completed ? 0 : remaining).toLocaleString('es-AR')], ['Estado', item.estado], ['Autorizante', form.nombre.trim()], ['DNI del autorizante', form.dni]];
        const cheques = (item.historial_pagos || []).flatMap(movement => movement.cheques || []);
        for (const cheque of cheques) fields.push(['Cheque', `N.º ${cheque.numero} · Importe ${Number(cheque.monto).toLocaleString('es-AR')} · Vencimiento ${cheque.vencimiento || 'Sin registrar'}`]);
        let y = Math.max(54, 36 + companyLines.length * 6 + 10);
        for (const [label, value] of fields) { const lines = doc.splitTextToSize(`${label}: ${value || '—'}`, 170); if (y + lines.length * 6 > 260) { doc.addPage(); y = 25; } doc.text(lines, 20, y); y += lines.length * 6 + 5; }
        if (y > 215) { doc.addPage(); y = 25; }
        const firmaY = y + 8; doc.addImage(signature, 'PNG', 20, firmaY, 90, 27); doc.line(20, firmaY + 30, 110, firmaY + 30); doc.text('Firma del autorizante', 20, firmaY + 37);
        const url = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(new Blob([doc.output('arraybuffer')], { type: 'application/pdf' })); });
        const filename = `orden_pago_${String(item.numero_comprobante || item._id).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
        onChange(await api.patch(endpoint, { orden_pago_pdf: filename, orden_pago_url: url }));
        doc.save(filename);
      }
      setMode(null);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const updateCheque = (index, key, value) => setForm(previous => ({ ...previous, cheques: previous.cheques.map((cheque, position) => position === index ? { ...cheque, [key]: value } : cheque) }));
  const chequeFields = <fieldset className="space-y-3"><legend className="text-sm font-medium mb-2">Cheques del movimiento</legend>{(form.cheques || []).map((cheque, index) => <div key={index} className="grid sm:grid-cols-3 gap-3 bg-content2 rounded-[10px] p-3"><label className="grid gap-1 text-xs">Número de cheque<input required disabled={busy} maxLength={100} value={cheque.numero} className="p-2 rounded-[10px] bg-content1 border border-divider" onChange={event => updateCheque(index, 'numero', event.target.value)} /></label><label className="grid gap-1 text-xs">Importe<input required disabled={busy} type="number" min="0.01" step="0.01" value={cheque.monto} className="p-2 rounded-[10px] bg-content1 border border-divider" onChange={event => updateCheque(index, 'monto', event.target.value)} /></label><label className="grid gap-1 text-xs">Vencimiento<input required disabled={busy} type="date" value={cheque.vencimiento} className="p-2 rounded-[10px] bg-content1 border border-divider" onChange={event => updateCheque(index, 'vencimiento', event.target.value)} /></label>{form.cheques.length > 1 && <button type="button" disabled={busy} aria-label="Eliminar cheque" className="text-danger flex items-center gap-1 text-xs" onClick={() => setForm(previous => ({ ...previous, cheques: previous.cheques.filter((_, position) => position !== index) }))}><Trash2 size={14} />Eliminar</button>}</div>)}<div className="flex flex-wrap items-center justify-between gap-2"><button type="button" disabled={busy} className="flex items-center gap-1 text-primary text-sm" onClick={() => setForm(previous => ({ ...previous, cheques: [...previous.cheques, { numero: '', monto: '', vencimiento: '' }] }))}><Plus size={16} />Agregar cheque</button><span className="text-xs text-default-500">Total cheques: {(form.cheques || []).reduce((sum, cheque) => sum + (Number(cheque.monto) || 0), 0).toLocaleString('es-AR')}</span></div></fieldset>;
  return <div className="min-w-44"><div className="flex items-center gap-1">
    <AppSelect ariaLabel={`Estado de la factura ${item.numero_comprobante}`} value={item.estado} disabled={busy || completed} compact options={[{ value: 'pendiente', label: 'Pendiente' }, { value: 'vencido', label: 'Vencido' }, { value: 'pago_parcial', label: payment ? 'Pago parcial' : 'Cobro parcial' }, { value: finalState, label: payment ? 'Pagado' : 'Cobrado' }]} onChange={changeState} />
    {payment && <button type="button" disabled={busy} title="Emitir orden de pago firmada" aria-label="Emitir orden de pago firmada" className="p-2 rounded-[10px] text-primary hover:bg-primary/10" onClick={() => open('orden')}><FileDown size={18} /></button>}
    {payment && item.orden_pago_url && <button type="button" disabled={busy} title="Visualizar orden de pago" aria-label="Visualizar orden de pago" className="p-2 rounded-[10px] text-primary hover:bg-primary/10 disabled:opacity-40" onClick={viewOrder}><Eye size={18} /></button>}
    {payment && item.orden_pago_url && <a title="Descargar orden de pago" aria-label="Descargar orden de pago" className="p-2 rounded-[10px] text-primary hover:bg-primary/10" href={item.orden_pago_url} download={item.orden_pago_pdf || 'orden_pago.pdf'}><Download size={18} /></a>}
  </div>{error && !mode && <p role="alert" className="text-xs text-danger whitespace-normal max-w-64 mt-1">{error}</p>}
    <Modal isOpen={Boolean(mode)} onClose={() => { if (!busy) setMode(null); }} isDismissable={!busy} isKeyboardDismissDisabled={busy} size="2xl" scrollBehavior="inside"><ModalContent><form onSubmit={submit}><ModalHeader>{mode === 'orden' ? 'Emitir orden de pago firmada' : payment ? 'Registrar pago' : 'Registrar cobro'}</ModalHeader><ModalBody><p className="text-sm text-default-500">{item.razon_social} · Factura {item.numero_comprobante} · {item.moneda || 'Moneda sin definir'}</p><label className="grid gap-1 text-sm">Fecha<input required disabled={busy} type="date" className="p-2 rounded-[10px] bg-content2 border border-divider" value={form.fecha || ''} onChange={event => setForm({ ...form, fecha: event.target.value })} /></label>{mode === 'movimiento' ? <><label className="grid gap-1 text-sm">Importe (saldo pendiente: {remaining.toLocaleString('es-AR')})<input required disabled={busy} type="number" min="0.01" max={remaining} step="0.01" className="p-2 rounded-[10px] bg-content2 border border-divider" value={form.monto ?? ''} onChange={event => setForm({ ...form, monto: event.target.value })} /></label><AppSelect label="Método" value={form.metodo} disabled={busy} options={[{ value: 'transferencia', label: 'Transferencia' }, { value: 'efectivo', label: 'Efectivo' }, { value: 'cheque', label: 'Cheque' }]} onChange={value => setForm({ ...form, metodo: value })} />{form.metodo === 'cheque' && chequeFields}<p className="text-xs text-default-500">Después de registrar el movimiento podés adjuntar su comprobante en la columna correspondiente.</p></> : <><label className="grid gap-1 text-sm">Nombre del autorizante<input required disabled={busy} maxLength={100} className="p-2 rounded-[10px] bg-content2 border border-divider" value={form.nombre || ''} onChange={event => setForm({ ...form, nombre: event.target.value })} /></label><label className="grid gap-1 text-sm">DNI del autorizante<input required disabled={busy} type="text" inputMode="numeric" pattern="[0-9]{7,8}" minLength={7} maxLength={8} placeholder="Sin puntos ni espacios" className="p-2 rounded-[10px] bg-content2 border border-divider" value={form.dni || ''} onChange={event => setForm({ ...form, dni: event.target.value.replace(/[^0-9]/g, '') })} /></label><Firma onChange={setSignature} /><p className="text-xs text-default-500">La orden se guarda con la firma y se descarga como PDF. Emitirla conserva el estado de la factura.</p></>}{error && <p role="alert" className="text-danger text-sm">{error}</p>}</ModalBody><ModalFooter><Button variant="light" disabled={busy} onPress={() => setMode(null)}>Cancelar</Button><Button type="submit" color="primary" isLoading={busy}>{mode === 'orden' ? 'Firmar y emitir PDF' : 'Confirmar'}</Button></ModalFooter></form></ModalContent></Modal>
    <Modal isOpen={Boolean(preview)} onClose={() => setPreview(null)} size="5xl" scrollBehavior="inside"><ModalContent><ModalHeader>{item.orden_pago_pdf || 'Orden de pago'}</ModalHeader><ModalBody><iframe src={preview || undefined} title="Orden de pago firmada" className="w-full h-[70vh] rounded-[10px] border border-divider" /></ModalBody><ModalFooter><Button variant="light" onPress={() => setPreview(null)}>Cerrar</Button><Button as="a" href={item.orden_pago_url} download={item.orden_pago_pdf || 'orden_pago.pdf'} color="primary" startContent={<Download size={18} />}>Descargar PDF</Button></ModalFooter></ModalContent></Modal>
  </div>;
}
