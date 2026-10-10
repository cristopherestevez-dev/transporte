const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validarArchivo } = require('../src/modules/facturacion/facturacion.archivos');

test('invoice attachments preserve PDF and JPG bytes and reject disguised or oversized files', () => {
  const pdf = Buffer.from('%PDF-1.7\ninvoice');
  const result = validarArchivo({ nombre: 'factura.pdf', tipo: 'application/pdf', contenido: pdf.toString('base64') });
  assert.deepEqual(result.data, pdf);
  assert.equal(result.tamaño, pdf.length);
  const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
  assert.deepEqual(validarArchivo({ nombre: 'factura.jpg', tipo: 'image/jpeg', contenido: jpg.toString('base64') }).data, jpg);
  assert.throws(() => validarArchivo({ nombre: 'factura.pdf', tipo: 'application/pdf', contenido: Buffer.from('<script>bad</script>').toString('base64') }), error => error.statusCode === 400);
  assert.throws(() => validarArchivo({ nombre: 'factura.jpg', tipo: 'image/jpeg', contenido: Buffer.alloc(5 * 1024 * 1024 + 1).toString('base64') }), error => error.statusCode === 400);
  assert.throws(() => validarArchivo({ nombre: 'factura.svg', tipo: 'image/svg+xml', contenido: pdf.toString('base64') }), error => error.statusCode === 400);
});

test('cheque payments require numbers, real due dates, and matching amounts', async () => {
  const { FacturacionService } = require('../src/modules/facturacion/facturacion.service');
  const { pagosNacionalesRepository: repo } = require('../src/modules/facturacion/facturacion.repository');
  const originalFind = repo.findById, originalUpdate = repo.update;
  let current = { monto: 100, estado: 'pendiente', monto_pagado: 0, historial_pagos: [], updatedAt: new Date() };
  const payment = cheques => ({ fecha: '2026-10-10', monto: 100, metodos_pago: { cheque: { enabled: true, monto: 100 } }, cheques });
  try {
    repo.findById = async () => current;
    repo.update = async (id, data) => current = { ...current, ...data };
    const service = new FacturacionService('pagos-nacionales');
    await assert.rejects(service.update('invoice', { historial_pagos: [payment([{ numero: '1', monto: 100 }])] }), error => error.statusCode === 400);
    await assert.rejects(service.update('invoice', { historial_pagos: [payment([{ numero: '1', monto: 100, vencimiento: '2026-02-31' }])] }), error => error.statusCode === 400);
    await assert.rejects(service.update('invoice', { historial_pagos: [payment([{ numero: '1', monto: 50, vencimiento: '2026-11-10' }])] }), error => error.statusCode === 400);
    await assert.rejects(service.update('invoice', { historial_pagos: [payment([{ numero: '1', monto: 50, vencimiento: '2026-11-10' }, { numero: '1', monto: 50, vencimiento: '2026-12-10' }])] }), error => error.statusCode === 400);
    await service.update('invoice', { historial_pagos: [payment([{ numero: '1', monto: 40, vencimiento: '2026-11-10' }, { numero: '2', monto: 60, vencimiento: '2026-12-10' }])] });
    assert.equal(current.estado, 'pagado');
    assert.equal(current.monto_restante, 0);
    assert.equal(current.cheques[1].vencimiento, '2026-12-10');
  } finally { repo.findById = originalFind; repo.update = originalUpdate; }
});

test('company logos accept image signatures only and stay out of ordinary company queries', () => {
  const { validarLogo } = require('../src/modules/usuarios/empresa-perfil.routes');
  const { EmpresaOperadora } = require('../src/modules/usuarios/empresas.model');
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString('base64');
  assert.equal(validarLogo(`data:image/png;base64,${png}`), `data:image/png;base64,${png}`);
  assert.throws(() => validarLogo('data:image/png;base64,aGVsbG8='), error => error.statusCode === 400);
  assert.throws(() => validarLogo('data:image/svg+xml;base64,PHN2Zz4='), error => error.statusCode === 400);
  assert.equal(EmpresaOperadora.schema.path('logo').options.select, false);
});

test('partial collections update the real balance and final collection settles the invoice', async () => {
  const { FacturacionService } = require('../src/modules/facturacion/facturacion.service');
  const { cobranzasNacionalesRepository: repo } = require('../src/modules/facturacion/facturacion.repository');
  const originalFind = repo.findById, originalUpdate = repo.update;
  let current = { monto: 100, estado: 'pendiente', monto_pagado: 0, historial_pagos: [], updatedAt: new Date() };
  const collection = monto => ({ fecha: '2026-10-10', monto, metodos_pago: { transferencia: { enabled: true, monto } }, cheques: [] });
  try {
    repo.findById = async () => current;
    repo.update = async (id, data) => current = { ...current, ...data };
    const service = new FacturacionService('cobranzas-nacionales');
    await assert.rejects(service.update('invoice', { estado: 'pagado' }), error => error.statusCode === 400);
    await service.update('invoice', { historial_pagos: [collection(40)] });
    assert.equal(current.estado, 'pago_parcial');
    assert.equal(current.monto_pagado, 40);
    assert.equal(current.monto_restante, 60);
    await assert.rejects(service.update('invoice', { historial_pagos: [...current.historial_pagos, collection(70)] }), error => error.statusCode === 400);
    await service.update('invoice', { historial_pagos: [...current.historial_pagos, collection(60)] });
    assert.equal(current.estado, 'cobrado');
    assert.equal(current.monto_restante, 0);
    await assert.rejects(service.update('invoice', { estado: 'pendiente' }), error => error.statusCode === 409);
    await service.update('invoice', { orden_pago_url: 'data:application/pdf;base64,JVBERi0xLjc=' });
    assert.equal(current.estado, 'cobrado');
  } finally { repo.findById = originalFind; repo.update = originalUpdate; }
});
