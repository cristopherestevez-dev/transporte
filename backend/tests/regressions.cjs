const { PerfilModel } = require('../src/modules/usuarios/perfiles.service');
PerfilModel.find = async () => [];
const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { env } = require('../src/config/env');
env.JWT_SECRET = 'isolated-test-secret';
const { authMiddleware, syncAuthMiddleware, requirePermission } = require('../src/shared/middleware/authMiddleware');
const { Usuario } = require('../src/modules/usuarios/usuarios.model');
const { FacturacionService } = require('../src/modules/facturacion/facturacion.service');
const { pagosNacionalesRepository } = require('../src/modules/facturacion/facturacion.repository');
const { MantenimientoService } = require('../src/modules/mantenimiento/mantenimiento.service');
const { MantenimientoRepository } = require('../src/modules/mantenimiento/mantenimiento.repository');

const token = (payload = {}, options = {}) => jwt.sign({ email: 'test@example.com', purpose: 'session', ...payload }, env.JWT_SECRET, {
  algorithm: 'HS256', issuer: 'transporte-frontend', audience: 'transporte-api', expiresIn: 60, ...options,
});
const request = (credential) => ({ headers: credential ? { authorization: `Bearer ${credential}` } : {} });
const run = async (middleware, req) => {
  let error;
  await middleware(req, {}, result => { error = result; });
  return error;
};

test('authentication rejects missing, forged and expired credentials before querying users', async () => {
  for (const credential of [undefined, 'forged', token({}, { expiresIn: -1 }), token({ purpose: 'sync' })]) {
    const error = await run(authMiddleware, request(credential));
    assert.ok([401, 403].includes(error.statusCode));
  }
});

test('active user permissions are loaded from the database on each request', async () => {
  const original = Usuario.findOne;
  try {
    Usuario.findOne = async () => ({ _id: 'user-id', activo: false, permisos: ['configuracion'] });
    assert.equal((await run(authMiddleware, request(token()))).statusCode, 403);
    Usuario.findOne = async () => ({ _id: 'user-id', activo: true, perfil: 'operador_logistico', permisos: ['viajes'] });
    const req = request(token({ permisos: ['configuracion'] }));
    assert.equal(await run(authMiddleware, req), undefined);
    assert.equal((await run(requirePermission('configuracion'), req)).statusCode, 403);
    assert.equal(await run(requirePermission('viajes'), req), undefined);
    assert.equal((await run(requirePermission('viajes'), { user: { permisos: [] } })).statusCode, 403);
  } finally { Usuario.findOne = original; }
});

test('OAuth synchronization credentials cannot impersonate a different email', async () => {
  const req = { ...request(token({ purpose: 'sync' })), body: { email: 'another@example.com' } };
  assert.equal((await run(syncAuthMiddleware, req)).statusCode, 403);
  req.body.email = 'test@example.com';
  assert.equal(await run(syncAuthMiddleware, req), undefined);
});

test('partial and final payments persist balances, reject overpayment and stale history', async () => {
  const originalFind = pagosNacionalesRepository.findById;
  const originalUpdate = pagosNacionalesRepository.update;
  let current = { _id: 'invoice-id', monto: 100, estado: 'pendiente', historial_pagos: [], updatedAt: new Date(0) };
  const payment = amount => ({ fecha: '2026-10-09', monto: amount, metodos_pago: { efectivo: { enabled: true, monto: String(amount) } }, cheques: [] });
  try {
    pagosNacionalesRepository.findById = async () => current;
    pagosNacionalesRepository.update = async (id, data, revision) => {
      assert.equal(revision, current.updatedAt);
      current = { ...current, ...data, updatedAt: new Date(current.updatedAt.getTime() + 1) };
      return current;
    };
    const service = new FacturacionService('pagos-nacionales');
    await assert.rejects(service.update('invoice-id', { estado: 'pagado' }), error => error.statusCode === 400);
    await service.update('invoice-id', { historial_pagos: [payment(40)] });
    assert.equal(current.estado, 'pago_parcial');
    assert.equal(current.monto_pagado, 40);
    assert.equal(current.monto_restante, 60);
    await assert.rejects(service.update('invoice-id', { historial_pagos: [payment(10)] }), error => error.statusCode === 409);
    await assert.rejects(service.update('invoice-id', { historial_pagos: [...current.historial_pagos, payment(70)] }), error => error.statusCode === 400);
    await assert.rejects(service.update('invoice-id', { historial_pagos: [...current.historial_pagos, payment(-1)] }), error => error.statusCode === 400);
    await service.update('invoice-id', { historial_pagos: [...current.historial_pagos, payment(60)] });
    assert.equal(current.estado, 'pagado');
    assert.equal(current.monto_restante, 0);
    await assert.rejects(service.update('invoice-id', { estado: 'pendiente' }), error => error.statusCode === 409);
    await assert.rejects(service.update('invoice-id', { orden_pago_url: 'blob:temporary' }), error => error.statusCode === 400);
  } finally {
    pagosNacionalesRepository.findById = originalFind;
    pagosNacionalesRepository.update = originalUpdate;
  }
});

test('maintenance rejects empty drafts and kilometers inconsistent with vehicle history', async () => {
  const originalFind = MantenimientoRepository.prototype.findByVehiculo;
  const originalCreate = MantenimientoRepository.prototype.create;
  let writes = 0;
  try {
    MantenimientoRepository.prototype.findByVehiculo = async () => [{ _id: 'older', fecha: '2026-10-08', km: 1000 }];
    MantenimientoRepository.prototype.create = async data => { writes++; return data; };
    const service = new MantenimientoService();
    const base = { vehiculoId: '507f1f77bcf86cd799439011', fecha: '2026-10-09', km: 1100 };
    await assert.rejects(service.create(base), error => error.statusCode === 400);
    await assert.rejects(service.create({ ...base, aceite_cambio: true, km: 900 }), error => error.statusCode === 400);
    await assert.rejects(service.create({ ...base, aceite_cambio: true, aceite_precioxl: -1 }), error => error.statusCode === 400);
    assert.equal(writes, 0);
    await service.create({ ...base, aceite_cambio: true });
    assert.equal(writes, 1);
  } finally {
    MantenimientoRepository.prototype.findByVehiculo = originalFind;
    MantenimientoRepository.prototype.create = originalCreate;
  }
});

test('HTTP API rejects anonymous reads, writes and profile assignment', async () => {
  const app = require('../src/app').default;
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const [method, path] of [['GET', '/api/viajes/nacionales'], ['POST', '/api/usuarios/asignar-perfil'], ['PATCH', '/api/facturacion/pagos/nacionales/123'], ['POST', '/api/usuarios/sync']]) {
      const status = await new Promise((resolve, reject) => {
        const req = require('node:http').request(base + path, { method, headers: { 'Content-Type': 'application/json' } }, res => { res.resume(); res.on('end', () => resolve(res.statusCode)); });
        req.on('error', reject);
        req.end(method === 'GET' ? undefined : '{}');
      });
      assert.equal(status, 401, path);
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
});
