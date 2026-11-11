"use client";
import Button from "@/app/components/ui/Button/button";
import { useEffect, useId, useRef, useState } from 'react';
import { FileDown, Download, Eye, Plus, Trash2 } from 'lucide-react';
import { AppDialog, DialogHeader, DialogBody, DialogFooter } from "@/app/components/ui/ModalWrapper/AppDialog";
import { createPaymentOrder } from './paymentOrder.mjs';
import api from '@/services/api';
import AppSelect from '../AppSelect/AppSelect';

const paymentMethods = [
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'cheque', label: 'Cheque' },
];

const toCents = value => Math.round((Number(value) || 0) * 100);

function Firma({ onChange }) {
  const canvas = useRef(null), drawing = useRef(false), ink = useRef(false);
  const position = event => {
    const rect = canvas.current.getBoundingClientRect();
    return [(event.clientX - rect.left) * canvas.current.width / rect.width, (event.clientY - rect.top) * canvas.current.height / rect.height];
  };
  const end = () => { if (drawing.current) { drawing.current = false; onChange(ink.current ? canvas.current.toDataURL('image/png') : ''); } };
  return <div><p className="text-sm font-medium mb-2">Firma del autorizante</p><canvas ref={canvas} width={600} height={180} aria-label="Dibujá tu firma con el mouse o el dedo" className="w-full h-44 bg-white border border-divider rounded-[10px] touch-none" onPointerDown={event => { const ctx = canvas.current.getContext('2d'); drawing.current = true; canvas.current.setPointerCapture(event.pointerId); ctx.strokeStyle = '#172033'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...position(event)); }} onPointerMove={event => { if (!drawing.current) return; ink.current = true; const ctx = canvas.current.getContext('2d'); ctx.lineTo(...position(event)); ctx.stroke(); }} onPointerUp={end} onPointerCancel={end} /><Button native type="button" className="text-sm text-primary mt-2" onClick={() => { canvas.current.getContext('2d').clearRect(0, 0, 600, 180); ink.current = false; onChange(''); }}>Limpiar firma</Button></div>;
}

export default function ComprobanteOperacion({ item, onChange, invoices }) {
  const chequeFieldId = useId();
  const grouped = Boolean(invoices);
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
  const methods = form.methods || {};
  const usesCheques = payment ? methods.cheque !== undefined : form.metodo === 'cheque';
  const chequeTotal = usesCheques ? form.cheques.reduce((sum, cheque) => sum + toCents(cheque.monto), 0) / 100 : 0;
  const movementAmount = payment
    ? (toCents(methods.transferencia) + toCents(methods.efectivo) + toCents(chequeTotal)) / 100
    : form.monto;
  const open = (action, target) => { setError(''); setSignature(''); setForm({ monto: remaining, metodo: 'transferencia', fecha: new Date().toLocaleDateString('en-CA'), nombre: '', dni: '', observaciones: '', methods: {}, cheques: [{ numero: '', monto: payment ? '' : remaining, vencimiento: '' }], target }); setMode(action); };
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
      if (mode !== 'orden') {
        const monto = Number(movementAmount);
        if (!(monto > 0) || monto > remaining) throw new Error('Ingresá un monto mayor a cero que no supere el saldo pendiente.');
        if (!payment && form.target === finalState && Math.abs(monto - remaining) > 0.005) throw new Error('Para finalizar la factura registrá todo el saldo pendiente. Para un importe menor, elegí pago/cobro parcial.');
        const cheques = usesCheques ? form.cheques.map(cheque => ({ numero: cheque.numero.trim(), monto: Number(cheque.monto), vencimiento: cheque.vencimiento })) : [];
        if (usesCheques && (!cheques.length || cheques.some(cheque => !cheque.numero || !(cheque.monto > 0) || !cheque.vencimiento))) {
          throw new Error('Completá número, vencimiento e importe de cada cheque.');
        }
        if (!payment && usesCheques && toCents(chequeTotal) !== toCents(monto)) {
          throw new Error('La suma de los cheques debe coincidir con el importe del cobro.');
        }
        const metodos_pago = payment
          ? Object.fromEntries(Object.entries(methods).map(([method, value]) => [
            method, { enabled: true, monto: method === 'cheque' ? chequeTotal : Number(value) },
          ]))
          : { [form.metodo]: { enabled: true, monto } };
        if (Object.values(metodos_pago).some(method => !(method.monto > 0))) {
          throw new Error('Ingresá un importe positivo para cada forma de pago seleccionada.');
        }
        const movement = { fecha: form.fecha, monto, metodos_pago, cheques, ...(payment && form.observaciones.trim() ? { observaciones: form.observaciones.trim() } : {}) };
        if (grouped) {
          if (toCents(monto) !== toCents(remaining)) throw new Error('Completá el saldo total de las facturas seleccionadas.');
          if (!signature || !form.nombre.trim() || !/^\d{7,8}$/.test(form.dni)) throw new Error('Completá el autorizante y firmá la orden.');
          const company = await api.get('/usuarios/empresa/perfil');
          const doc = createPaymentOrder({
            item: { ...item, historial_pagos: [movement], monto_pagado: (toCents(item.monto_pagado) + toCents(monto)) / 100, estado: 'pagado' },
            company, form, signature, remaining: 0, methods: paymentMethods, invoices,
          });
          const orden_pago_pdf = 'orden_pago_agrupada_' + form.fecha + '.pdf';
          const saved = await api.post('/facturacion/' + item.endpoint + '/orden-agrupada', {
            facturas: invoices.map(invoice => ({ id: invoice._id, version: invoice.updatedAt })),
            pago: movement, orden_pago_pdf, orden_pago_url: doc.output('datauristring').replace(/;filename=[^;]+/, ''),
          });
          onChange(saved);
          doc.save(orden_pago_pdf);
        } else {
          onChange(await api.patch(endpoint, { historial_pagos: [...(item.historial_pagos || []), movement] }));
        }
      } else {
        if (!signature || !form.nombre.trim() || !/^\d{7,8}$/.test(form.dni || '')) throw new Error('Completá el nombre, un DNI de 7 u 8 dígitos y dibujá la firma.');
        const company = await api.get('/usuarios/empresa/perfil');
        const doc = createPaymentOrder({ item, company, form, signature, remaining: completed ? 0 : remaining, methods: paymentMethods });
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
  const availableFor = value => Math.max(0, toCents(remaining) - toCents(movementAmount) + toCents(value)) / 100;
  const toggleMethod = method => {
    setError('');
    setForm(previous => {
      const next = { ...previous.methods };
      if (method in next) delete next[method];
      else next[method] = '';
      return { ...previous, methods: next };
    });
  };
  const setMethodAmount = (method, amount) => setForm(previous => ({
    ...previous, methods: { ...previous.methods, [method]: amount },
  }));
  const remainderButton = (amount, fill) => (
    <Button native type="button" disabled={busy || amount <= 0}
      className="px-2 text-xs font-semibold text-primary disabled:opacity-40"
      onClick={() => { setError(''); fill(String(amount)); }}>
      Restante
    </Button>
  );
  const updateAmount = (value, limit, apply) => {
    if (Number(value) > limit) {
      setError(`El importe máximo disponible es ${limit.toLocaleString('es-AR')} ${item.moneda || ''}.`);
      return;
    }
    setError('');
    apply(value);
  };
  const chequeFields = (
    <fieldset className="space-y-3">
      <legend className="mb-2 text-sm font-medium">Cheques del movimiento</legend>
      {(form.cheques || []).map((cheque, index) => (
        <div key={index} className="grid items-start gap-3 rounded-[10px] bg-content2 p-3 sm:grid-cols-3">
          <label className="grid min-w-0 gap-1 text-xs">
            Número de cheque
            <input required disabled={busy} maxLength={100} value={cheque.numero}
              className="h-10 w-full min-w-0 rounded-[10px] border border-divider bg-content1 px-2"
              onChange={event => updateCheque(index, 'numero', event.target.value)} />
          </label>
          <div className="grid min-w-0 gap-1 text-xs">
            <label htmlFor={chequeFieldId + '-' + index}>Importe</label>
            <div className="flex h-10 min-w-0 items-center rounded-[10px] border border-divider bg-content1 focus-within:ring-2 focus-within:ring-primary/40">
              <input id={chequeFieldId + '-' + index} required disabled={busy} type="number" min="0.01" step="0.01"
                max={payment ? availableFor(cheque.monto) : undefined} value={cheque.monto}
                className="h-full min-w-0 flex-1 appearance-none bg-transparent px-2 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                onChange={event => {
                  const value = event.target.value;
                  if (payment) updateAmount(value, availableFor(cheque.monto), amount => updateCheque(index, 'monto', amount));
                  else updateCheque(index, 'monto', value);
                }} />
              {payment && remainderButton(availableFor(cheque.monto), amount => updateCheque(index, 'monto', amount))}
            </div>
          </div>
          <label className="grid min-w-0 gap-1 text-xs">
            Vencimiento
            <input required disabled={busy} type="date" value={cheque.vencimiento}
              className="h-10 w-full min-w-0 rounded-[10px] border border-divider bg-content1 px-2"
              onChange={event => updateCheque(index, 'vencimiento', event.target.value)} />
          </label>
          {form.cheques.length > 1 && <Button native type="button" disabled={busy} aria-label="Eliminar cheque"
            className="flex items-center gap-1 text-xs text-danger"
            onClick={() => setForm(previous => ({ ...previous, cheques: previous.cheques.filter((_, position) => position !== index) }))}>
            <Trash2 size={14} />Eliminar
          </Button>}
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button native type="button" disabled={busy} className="flex items-center gap-1 text-sm text-primary"
          onClick={() => setForm(previous => ({ ...previous, cheques: [...previous.cheques, { numero: '', monto: '', vencimiento: '' }] }))}>
          <Plus size={16} />Agregar cheque
        </Button>
        <span className="text-xs text-default-500">Total cheques: {chequeTotal.toLocaleString('es-AR')}</span>
      </div>
    </fieldset>
  );
  return <div className={grouped ? 'inline-block' : 'w-[264px] mx-auto'}>{grouped ? <Button native type="button" disabled={busy} onClick={() => open('grupo')} className="bg-brand-navy px-3 py-2 text-sm text-white">Pagar y emitir orden agrupada</Button> : <><div className="grid grid-cols-[144px_112px] items-center gap-2">
    <AppSelect className="w-full" ariaLabel={`Estado de la factura ${item.numero_comprobante}`} value={item.estado} disabled={busy || completed} compact options={[{ value: 'pendiente', label: 'Pendiente' }, { value: 'vencido', label: 'Vencido' }, { value: 'pago_parcial', label: payment ? 'Pago parcial' : 'Cobro parcial' }, { value: finalState, label: payment ? 'Pagado' : 'Cobrado' }]} onChange={changeState} />
    <div className="grid grid-cols-3 items-center gap-1">
    {payment && <Button native type="button" disabled={busy} title="Emitir orden de pago firmada" aria-label="Emitir orden de pago firmada" className="w-9 h-9 flex items-center justify-center shrink-0 rounded-[10px] text-primary hover:bg-primary/10" onClick={() => open('orden')}><FileDown size={18} /></Button>}
    {payment && (item.orden_pago_url ? <Button native type="button" disabled={busy} title="Visualizar orden de pago" aria-label="Visualizar orden de pago" className="w-9 h-9 flex items-center justify-center shrink-0 rounded-[10px] text-primary hover:bg-primary/10 disabled:opacity-40" onClick={viewOrder}><Eye size={18} /></Button> : <span aria-hidden="true" className="w-9 h-9" />)}
    {payment && (item.orden_pago_url ? <Button native as="a" title="Descargar orden de pago" aria-label="Descargar orden de pago" className="w-9 h-9 flex items-center justify-center shrink-0 rounded-[10px] text-primary hover:bg-primary/10" href={item.orden_pago_url} download={item.orden_pago_pdf || 'orden_pago.pdf'}><Download size={18} /></Button> : <span aria-hidden="true" className="w-9 h-9" />)}
    </div>
  </div>
    {payment && item.estado === 'pago_parcial' && <Button native type="button" disabled={busy} className="mt-1 text-xs text-primary" onClick={() => open('movimiento', 'pago_parcial')}>Registrar otro pago</Button>}
    {error && !mode && <p role="alert" className="text-xs text-danger whitespace-normal max-w-64 mt-1">{error}</p>}</>}
    <AppDialog isOpen={Boolean(mode)} onClose={() => { if (!busy) setMode(null); }} isDismissable={!busy} isKeyboardDismissDisabled={busy} size="2xl" scrollBehavior="inside"><form onSubmit={submit}><DialogHeader>{grouped ? 'Pagar y emitir orden agrupada' : mode === 'orden' ? 'Emitir orden de pago firmada' : payment ? 'Registrar pago' : 'Registrar cobro'}</DialogHeader><DialogBody><p className="text-sm text-default-500">{item.razon_social} · {grouped ? invoices.length + ' facturas' : 'Factura ' + item.numero_comprobante} · {item.moneda || 'Moneda sin definir'}</p><label className="grid gap-1 text-sm">Fecha<input required disabled={busy} type="date" className="p-2 rounded-[10px] bg-content2 border border-divider" value={form.fecha || ''} onChange={event => setForm({ ...form, fecha: event.target.value })} /></label>{mode !== 'orden' && <><label className="grid gap-1 text-sm">Importe (saldo pendiente: {remaining.toLocaleString('es-AR')})<input required disabled={busy} type="number" min="0.01" max={remaining} step="0.01" className="p-2 rounded-[10px] bg-content2 border border-divider" readOnly={payment} value={movementAmount ?? ''} onChange={event => updateAmount(event.target.value, remaining, monto => setForm(previous => ({ ...previous, monto })))} /></label>{payment ? (
      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-medium">Formas de pago</legend>
        {paymentMethods.map(({ value, label }) => (
          <div key={value} className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={value in methods} disabled={busy} onChange={() => toggleMethod(value)} />
              {label}
            </label>
            {value !== 'cheque' && value in methods && <>
              <input aria-label={`Importe de ${label.toLowerCase()}`} required disabled={busy} type="number" min="0.01" step="0.01" max={availableFor(methods[value])}
                value={methods[value]} className="w-32 rounded-[10px] border border-divider bg-content2 p-2"
                onChange={event => updateAmount(event.target.value, availableFor(methods[value]), amount => setMethodAmount(value, amount))} />
              {remainderButton(availableFor(methods[value]), amount => setMethodAmount(value, amount))}
            </>}
          </div>
        ))}
        <p className="text-sm text-default-500">Saldo por cubrir: {availableFor(0).toLocaleString('es-AR')} {item.moneda}</p>
      </fieldset>
    ) : <AppSelect label="Método" value={form.metodo} disabled={busy} options={paymentMethods} onChange={value => setForm({ ...form, metodo: value })} />}
    {usesCheques && chequeFields}
    {payment && <label className="grid gap-1 text-sm">
      Observaciones (opcional)
      <textarea rows={3} maxLength={1000} disabled={busy} value={form.observaciones || ''} className="p-2 rounded-[10px] bg-content2 border border-divider" onChange={event => setForm({ ...form, observaciones: event.target.value })} />
    </label>}
    <p className="text-xs text-default-500">Después de registrar el movimiento podés adjuntar su comprobante en la columna correspondiente.</p></>}{(grouped || mode === 'orden') && <><label className="grid gap-1 text-sm">Nombre del autorizante<input required disabled={busy} maxLength={100} className="p-2 rounded-[10px] bg-content2 border border-divider" value={form.nombre || ''} onChange={event => setForm({ ...form, nombre: event.target.value })} /></label><label className="grid gap-1 text-sm">DNI del autorizante<input required disabled={busy} type="text" inputMode="numeric" pattern="[0-9]{7,8}" minLength={7} maxLength={8} placeholder="Sin puntos ni espacios" className="p-2 rounded-[10px] bg-content2 border border-divider" value={form.dni || ''} onChange={event => setForm({ ...form, dni: event.target.value.replace(/[^0-9]/g, '') })} /></label><Firma onChange={setSignature} /><p className="text-xs text-default-500">{grouped ? 'Al firmar y confirmar, se pagará el saldo completo de las facturas seleccionadas.' : 'La orden se guarda con la firma y se descarga como PDF. Emitirla conserva el estado de la factura.'}</p></>}{error && <p role="alert" className="text-danger text-sm">{error}</p>}</DialogBody><DialogFooter><Button variant="light" disabled={busy} onPress={() => setMode(null)}>Cancelar</Button><Button type="submit" color="primary" isLoading={busy}>{grouped ? 'Confirmar pago y emitir PDF' : mode === 'orden' ? 'Firmar y emitir PDF' : 'Confirmar'}</Button></DialogFooter></form></AppDialog>
    <AppDialog isOpen={Boolean(preview)} onClose={() => setPreview(null)} size="5xl" scrollBehavior="inside"><DialogHeader>{item.orden_pago_pdf || 'Orden de pago'}</DialogHeader><DialogBody><iframe src={preview || undefined} title="Orden de pago firmada" className="w-full h-[70vh] rounded-[10px] border border-divider" /></DialogBody><DialogFooter><Button variant="light" onPress={() => setPreview(null)}>Cerrar</Button><Button as="a" href={item.orden_pago_url} download={item.orden_pago_pdf || 'orden_pago.pdf'} color="primary" startContent={<Download size={18} />}>Descargar PDF</Button></DialogFooter></AppDialog>
  </div>;
}
