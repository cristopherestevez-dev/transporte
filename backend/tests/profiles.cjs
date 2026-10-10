const { PerfilModel } = require('../src/modules/usuarios/perfiles.service');
PerfilModel.find = async () => [];
const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { env } = require('../src/config/env');
const { Usuario, perfilesAsignados } = require('../src/modules/usuarios/usuarios.model');
const { UsuariosService } = require('../src/modules/usuarios/usuarios.service');
const { authMiddleware, requirePermission } = require('../src/shared/middleware/authMiddleware');
env.JWT_SECRET = 'profile-test-secret';

const run = async (middleware, req) => {
  let error;
  await middleware(req, {}, result => { error = result; });
  return error;
};
const request = perfil => ({ headers: { authorization: `Bearer ${jwt.sign({ email: 'test@example.com', purpose: 'session', perfil }, env.JWT_SECRET, { algorithm: 'HS256', issuer: 'transporte-frontend', audience: 'transporte-api', expiresIn: 60 })}` } });

test('legacy profiles remain available and multiple profiles are normalized', () => {
  assert.deepEqual(perfilesAsignados({ perfil: 'operador_seguridad', perfiles: [] }), ['operador_seguridad']);
  assert.deepEqual(perfilesAsignados({ perfil: null, perfiles: [] }), []);
  assert.deepEqual(perfilesAsignados({ perfiles: ['operador_logistico', 'operador_administrativo', 'operador_logistico'] }), ['operador_logistico', 'operador_administrativo']);
});

test('requests use only the selected assigned profile and reject unassigned or revoked profiles', async () => {
  const original = Usuario.findOne;
  let profiles = ['operador_logistico', 'operador_administrativo'];
  try {
    Usuario.findOne = async () => ({ _id: 'user-id', activo: true, perfiles: profiles, perfil: 'operador_logistico', permisos: ['configuracion', 'viajes', 'facturacion'] });
    const logistics = request('operador_logistico');
    assert.equal(await run(authMiddleware, logistics), undefined);
    assert.equal(await run(requirePermission('viajes'), logistics), undefined);
    assert.equal((await run(requirePermission('facturacion'), logistics)).statusCode, 403);
    const administration = request('operador_administrativo');
    assert.equal(await run(authMiddleware, administration), undefined);
    assert.equal(await run(requirePermission('facturacion'), administration), undefined);
    assert.equal((await run(requirePermission('configuracion'), administration)).statusCode, 403);
    assert.equal((await run(authMiddleware, request('operador_seguridad'))).statusCode, 403);
    profiles = ['operador_logistico'];
    assert.equal((await run(authMiddleware, administration)).statusCode, 403);
  } finally { Usuario.findOne = original; }
});

test('assignment validates profiles, ignores forged permissions, and supports removing all profiles', async () => {
  const original = Usuario.findByIdAndUpdate;
  let writes = 0;
  try {
    Usuario.findByIdAndUpdate = async (id, update) => { writes++; return update.$set; };
    const service = new UsuariosService();
    for (const perfiles of ['operador_seguridad', ['invalid'], [null]]) {
      await assert.rejects(service.update('user-id', { perfiles }), error => error.statusCode === 400);
    }
    assert.equal(writes, 0);
    const result = await service.update('user-id', { perfiles: ['operador_logistico', 'operador_administrativo'], permisos: ['configuracion'] });
    assert.deepEqual(result.perfiles, ['operador_logistico', 'operador_administrativo']);
    assert.ok(result.permisos.includes('viajes') && result.permisos.includes('facturacion'));
    assert.ok(!result.permisos.includes('configuracion'));
    const cleared = await service.update('user-id', { perfiles: [], perfil: 'operador_seguridad' });
    assert.equal(cleared.perfil, null);
    assert.deepEqual(cleared.permisos, []);
  } finally { Usuario.findByIdAndUpdate = original; }
});
