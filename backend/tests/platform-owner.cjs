const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { env } = require('../src/config/env');
const { tenantContext } = require('../src/shared/tenant');
const { Usuario } = require('../src/modules/usuarios/usuarios.model');
const { EmpresaOperadora } = require('../src/modules/usuarios/empresas.model');
const { PerfilModel } = require('../src/modules/usuarios/perfiles.service');
const { UsuariosService } = require('../src/modules/usuarios/usuarios.service');
const { CreateUsuarioSchema, LoginUsuarioSchema } = require('../src/modules/usuarios/usuarios.dto');
const { crearEmpresa, actualizarEmpresa } = require('../src/modules/usuarios/empresas.service');
const { authMiddleware, requireSecurityProfile } = require('../src/shared/middleware/authMiddleware');
env.JWT_SECRET = 'platform-owner-tests'; env.SUPERADMIN_EMAIL = 'owner@example.com';
const companyId = '507f1f77bcf86cd799439011';
const request = (email, perfil) => ({ path: '/protected', headers: { authorization: `Bearer ${jwt.sign({ email, perfil, purpose: 'session' }, env.JWT_SECRET, { expiresIn: 60, issuer: 'transporte-frontend', audience: 'transporte-api' })}` } });
const run = (middleware, req) => new Promise(resolve => middleware(req, {}, error => resolve(error)));

test('only the configured owner receives platform privileges; security is restricted to its company', async () => {
  const originals = { user: Usuario.findOne, profiles: PerfilModel.find, company: EmpresaOperadora.exists };
  let current;
  try {
    Usuario.findOne = async () => current; PerfilModel.find = async () => []; EmpresaOperadora.exists = async () => true;
    current = { _id: 'owner-id', email: 'owner@example.com', activo: true, estado: 'aprobado', perfiles: ['superadmin'] };
    const req = request(current.email, 'superadmin');
    assert.equal(await run(authMiddleware, req), undefined);
    assert.equal(req.user.role, 'superadmin');
    current = { ...current, email: 'imposter@example.com' };
    assert.equal((await run(authMiddleware, request(current.email, 'superadmin'))).statusCode, 403);
    current = { _id: 'security-id', email: 'security@example.com', empresaId: companyId, activo: true, estado: 'aprobado', perfiles: ['operador_seguridad'] };
    await new Promise(resolve => authMiddleware(request(current.email, 'operador_seguridad'), {}, async error => {
      assert.equal(error, undefined); assert.equal(tenantContext.getStore().superAdmin, false);
      await assert.rejects(crearEmpresa({ nombre: 'Forbidden', codigo: 'forbidden' }, current.email), error => error.statusCode === 403);
      await assert.rejects(actualizarEmpresa(companyId, { activo: true }), error => error.statusCode === 403);
      resolve();
    }));
    assert.equal((await run(requireSecurityProfile, { user: { role: 'operador_seguridad' } })).statusCode, 403);
  } finally { Usuario.findOne = originals.user; PerfilModel.find = originals.profiles; EmpresaOperadora.exists = originals.company; }
});

test('disabled companies block operational requests while identity refresh stays available', async () => {
  const originals = { user: Usuario.findOne, profiles: PerfilModel.find, company: EmpresaOperadora.exists };
  try {
    Usuario.findOne = async () => ({ _id: 'user-id', email: 'user@example.com', empresaId: companyId, activo: true, estado: 'aprobado', perfiles: ['operador_logistico'] });
    PerfilModel.find = async () => []; EmpresaOperadora.exists = async () => false;
    assert.equal((await run(authMiddleware, request('user@example.com', 'operador_logistico'))).statusCode, 403);
    const identity = request('user@example.com', 'operador_logistico'); identity.path = '/permisos/user@example.com';
    assert.equal(await run(authMiddleware, identity), undefined);
  } finally { Usuario.findOne = originals.user; PerfilModel.find = originals.profiles; EmpresaOperadora.exists = originals.company; }
});

test('username accounts are created and authenticated without requiring email', async () => {
  const originals = { find: Usuario.findOne, create: Usuario.create, company: EmpresaOperadora.exists, profiles: PerfilModel.find };
  try {
    PerfilModel.find = async () => []; EmpresaOperadora.exists = async () => true; Usuario.findOne = async () => null;
    Usuario.create = async data => new Usuario(data);
    const input = CreateUsuarioSchema.parse({ usuario: 'chofer.123', nombre: 'Test', password: 'password-123', perfiles: ['operador_logistico'], empresaId: companyId });
    assert.equal(input.email, undefined);
    const user = await new UsuariosService().create(input);
    assert.equal(user.usuario, 'chofer.123'); assert.equal(user.toJSON().passwordHash, undefined);
    Usuario.findOne = filter => ({ select: async () => { assert.deepEqual(filter.$or, [{ email: 'chofer.123' }, { usuario: 'chofer.123' }]); return user; } });
    const credentials = LoginUsuarioSchema.parse({ email: 'CHOFER.123', password: 'password-123' });
    const logged = await new UsuariosService().login(credentials.email, credentials.password);
    assert.equal(logged.id, user._id.toString());
    await assert.rejects(new UsuariosService().login(credentials.email, 'wrong-password'), error => error.statusCode === 401);
    assert.equal(CreateUsuarioSchema.safeParse({ ...input, usuario: 'bad username' }).success, false);
    assert.equal(CreateUsuarioSchema.safeParse({ ...input, usuario: undefined, email: '' }).success, false);
  } finally { Usuario.findOne = originals.find; Usuario.create = originals.create; EmpresaOperadora.exists = originals.company; PerfilModel.find = originals.profiles; }
});

test('company security cannot assign the owner profile even with forged permissions', async () => {
  const originals = { user: Usuario.findOne, profiles: PerfilModel.find, company: EmpresaOperadora.exists };
  try {
    Usuario.findOne = async () => ({ _id: 'target', empresaId: companyId, perfiles: [] });
    PerfilModel.find = async () => []; EmpresaOperadora.exists = async () => true;
    await tenantContext.run({ empresaId: companyId, superAdmin: false }, async () => {
      await assert.rejects(new UsuariosService().update('target', { perfiles: ['superadmin'], permisos: ['configuracion'] }), error => error.statusCode === 403);
    });
  } finally { Usuario.findOne = originals.user; PerfilModel.find = originals.profiles; EmpresaOperadora.exists = originals.company; }
});
