const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { tenantContext } = require('../src/shared/tenant');
const { Usuario } = require('../src/modules/usuarios/usuarios.model');
const { EmpresaOperadora } = require('../src/modules/usuarios/empresas.model');
const { ChoferModel } = require('../src/modules/choferes/choferes.model');
const { PerfilModel } = require('../src/modules/usuarios/perfiles.service');
const { UsuariosService } = require('../src/modules/usuarios/usuarios.service');
const { hashPassword, verifyPassword } = require('../src/modules/usuarios/password');
const TenantModel = mongoose.model('TenantVerification', new mongoose.Schema({ nombre: String }, { collection: 'camiones' }));
const pre = (operation, target) => new Promise((resolve, reject) => TenantModel.schema.s.hooks.execPre(operation, target, [], error => error ? reject(error) : resolve()));

test('tenant queries and aggregates cannot override the authenticated company', async () => {
  for (const empresaId of ['company-a', 'company-b']) {
    await tenantContext.run({ empresaId }, async () => {
      for (const operation of ['find', 'findOne', 'countDocuments', 'deleteMany', 'findOneAndUpdate']) {
        const query = operation === 'findOneAndUpdate' ? TenantModel.findOneAndUpdate({ empresaId: 'foreign-company' }, { $set: { empresaId: 'foreign-company', nombre: 'updated' } }) : TenantModel[operation]({ empresaId: 'foreign-company' });
        await pre(operation, query);
        assert.deepEqual(query.getFilter(), { $and: [{ empresaId: 'foreign-company' }, { empresaId }] });
        if (query.getUpdate()) assert.equal(query.getUpdate().$set.empresaId, undefined);
      }
      const aggregate = TenantModel.aggregate([{ $group: { _id: null, total: { $sum: 1 } } }]);
      await pre('aggregate', aggregate);
      assert.deepEqual(aggregate.pipeline()[0], { $match: { empresaId } });
      const doc = new TenantModel({ nombre: 'new', empresaId: 'foreign-company' });
      await doc.validate();
      assert.equal(doc.empresaId, empresaId);
    });
  }
  await tenantContext.run({ superAdmin: true }, async () => {
    await assert.rejects(pre('find', TenantModel.find()), error => error.statusCode === 403);
  });
});

test('company selection executes lazy driver queries inside the selected tenant context', async () => {
  const companyExists = EmpresaOperadora.exists, findDrivers = ChoferModel.find;
  try {
    EmpresaOperadora.exists = async () => true;
    ChoferModel.find = () => ({ select: () => ({ then: resolve => resolve([{ empresaId: tenantContext.getStore()?.empresaId }]) }) });
    await tenantContext.run({ superAdmin: true }, async () => {
      const drivers = await new UsuariosService().choferesEmpresa('company-a');
      assert.equal(drivers[0].empresaId, 'company-a');
    });
    await tenantContext.run({ empresaId: 'company-a' }, async () => {
      await assert.rejects(new UsuariosService().choferesEmpresa('company-b'), error => error.statusCode === 400);
    });
  } finally { EmpresaOperadora.exists = companyExists; ChoferModel.find = findDrivers; }
});

test('passwords use salted hashes and are never serialized with user records', async () => {
  const hash = await hashPassword('password-test-123');
  assert.notEqual(hash, await hashPassword('password-test-123'));
  assert.equal(await verifyPassword('password-test-123', hash), true);
  assert.equal(await verifyPassword('wrong', hash), false);
  assert.equal(await verifyPassword('anything', undefined), false);
  const user = new Usuario({ email: 'test@example.com', nombre: 'Test', passwordHash: hash });
  assert.equal(user.toJSON().passwordHash, undefined);
  assert.equal(user.toObject().passwordHash, undefined);
});

test('new Google users remain pending without roles or company access', async () => {
  const find = Usuario.findOne, create = Usuario.create;
  try {
    Usuario.findOne = async () => null;
    Usuario.create = async data => data;
    const user = await new UsuariosService().syncFromGoogle({ email: 'New@Example.com', nombre: 'New' });
    assert.equal(user.email, 'new@example.com');
    assert.equal(user.activo, false);
    assert.equal(user.estado, 'pendiente');
    assert.deepEqual(user.perfiles, []);
    assert.equal(user.empresaId, undefined);
  } finally { Usuario.findOne = find; Usuario.create = create; }
});

test('driver HTTP endpoints use the logged-in driver and assigned truck, ignoring supplied IDs', async () => {
  const express = require('express'), jwt = require('jsonwebtoken');
  const { env } = require('../src/config/env');
  env.JWT_SECRET = 'driver-verification-secret';
  const { miOperacionRoutes } = require('../src/modules/usuarios/mi-operacion.routes');
  const { requirePermission } = require('../src/shared/middleware/authMiddleware');
  const { ViajeNacionalModel, ViajeInternacionalModel } = require('../src/modules/viajes/viajes.model');
  const { CamionModel } = require('../src/modules/camiones/camiones.model');
  const { MantenimientoModel } = require('../src/modules/mantenimiento/mantenimiento.model');
  const restore = [];
  const mock = (object, key, value) => { restore.push(() => { object[key] = original; }); const original = object[key]; object[key] = value; };
  const user = { _id: 'user-a', empresaId: 'company-a', choferId: 'driver-a', activo: true, estado: 'aprobado', perfiles: ['chofer'] };
  let server;
  try {
    mock(PerfilModel, 'find', async () => []);
    mock(Usuario, 'findOne', async () => user); mock(Usuario, 'findById', async () => user);
    mock(EmpresaOperadora, 'exists', async () => true);
    mock(ChoferModel, 'findById', async id => { assert.equal(id, 'driver-a'); return { _id: 'driver-a', camionId: 'truck-a' }; });
    for (const model of [ViajeNacionalModel, ViajeInternacionalModel]) mock(model, 'aggregate', async pipeline => {
      assert.deepEqual(pipeline[0].$match, { tipoAsignacion: 'chofer', asignadoId: 'driver-a' });
      assert.equal(tenantContext.getStore().empresaId, 'company-a');
      const facet = pipeline.at(-1).$facet;
      assert.equal(facet.items.at(-1).$project.tarifaTotal, undefined);
      assert.equal(facet.items[2].$limit, 5);
      assert.deepEqual(pipeline.find(stage => stage.$unionWith).$unionWith.pipeline[0].$match.$and[0], { empresaId: 'company-a' });
      return [{ items: [{ _id: 'trip-a' }, { _id: 'trip-b' }], count: [{ total: 2 }], summary: [{ totalChofer: 100, adelantos: 10, neto: 90, pendientes: 0 }] }];
    });
    mock(CamionModel, 'findById', async id => { assert.equal(id, 'truck-a'); return { _id: 'truck-a', patente: 'AA123AA' }; });
    mock(MantenimientoModel, 'find', filter => {
      assert.equal(filter.vehiculoId, 'truck-a');
      const query = { getFilter: () => filter, getOptions: () => ({}), setQuery: () => query, sort: () => query, skip: () => query, limit: () => query, then: resolve => resolve([{ _id: 'service-a' }]) };
      return query;
    });
    mock(MantenimientoModel, 'countDocuments', async () => 1);
    const app = express(); app.use('/mi-operacion', miOperacionRoutes);
    app.use((error, req, res, next) => res.status(error.statusCode || 500).json({ message: error.message }));
    server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    const token = jwt.sign({ email: 'test@example.com', purpose: 'session', perfil: 'chofer' }, env.JWT_SECRET, { expiresIn: 60, issuer: 'transporte-frontend', audience: 'transporte-api' });
    const headers = { Authorization: `Bearer ${token}` }, base = `http://127.0.0.1:${server.address().port}/mi-operacion`;
    assert.equal((await fetch(base + '/viajes')).status, 401);
    const trips = await fetch(base + '/viajes?choferId=foreign-driver&empresaId=foreign-company', { headers });
    assert.equal(trips.status, 200);
    const tripsBody = await trips.json();
    assert.equal(tripsBody.data.length, 2);
    assert.equal(tripsBody.pagination.pageSize, 5);
    assert.equal(tripsBody.summary.neto, 90);
    assert.equal((await fetch(base + '/viajes?pageSize=100', { headers })).status, 400);
    const truck = await fetch(base + '/camion?camionId=foreign-truck', { headers });
    assert.equal(truck.status, 200); assert.equal((await truck.json()).data.camion._id, 'truck-a');
    let denied; requirePermission('viajes', 'camiones', 'configuracion')({ user: { permisos: ['mis-viajes', 'mi-camion'] } }, {}, error => { denied = error; });
    assert.equal(denied.statusCode, 403);
  } finally { for (const reset of restore.reverse()) reset(); if (server) await new Promise(resolve => server.close(resolve)); }
});
