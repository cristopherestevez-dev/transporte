const { test } = require('node:test');
const assert = require('node:assert/strict');
const { tenantContext } = require('../src/shared/tenant');
const { Usuario } = require('../src/modules/usuarios/usuarios.model');
const { PerfilModel, permisosPorPerfil, actualizarPermisosPerfil, crearPerfil, eliminarPerfil } = require('../src/modules/usuarios/perfiles.service');

test('permission definitions support custom profiles and company overrides without leaking to other companies', async () => {
  const find = PerfilModel.find;
  try {
    PerfilModel.find = async filter => typeof filter.empresaId === 'object' ? [] : filter.empresaId === 'company-a' ? [{ codigo: 'supervisor', perfil: 'company-a:supervisor', nombre: 'Supervisor', activo: true, permisos: ['viajes'] }, { codigo: 'operador_logistico', perfil: 'company-a:operador_logistico', permisos: ['camiones'], activo: true }] : [];
    assert.deepEqual((await permisosPorPerfil('company-a')).supervisor, ['viajes']);
    assert.deepEqual((await permisosPorPerfil('company-a')).operador_logistico, ['camiones']);
    assert.equal((await permisosPorPerfil('company-b')).supervisor, undefined);
    assert.ok((await permisosPorPerfil('company-b')).operador_logistico.includes('viajes'));
  } finally { PerfilModel.find = find; }
});

test('profile CRUD enforces driver restrictions, preserves security and uses company storage keys', async () => {
  const original = { find: PerfilModel.find, update: PerfilModel.findOneAndUpdate, create: PerfilModel.create, exists: Usuario.exists };
  const records = [];
  let assigned = false;
  try {
    PerfilModel.find = async filter => typeof filter.empresaId === 'object' ? [] : records;
    PerfilModel.create = async data => { records.push(data); return data; };
    PerfilModel.findOneAndUpdate = async (filter, update) => {
      assert.ok(filter.perfil.startsWith('company-a:'));
      const record = { perfil: filter.perfil, ...update.$set };
      const index = records.findIndex(item => item.perfil === filter.perfil);
      if (index < 0) records.push(record); else records[index] = { ...records[index], ...record };
      return { toObject: () => record };
    };
    Usuario.exists = async filter => { assert.equal(filter.empresaId, 'company-a'); return assigned; };
    await tenantContext.run({ empresaId: 'company-a' }, async () => {
      await assert.rejects(actualizarPermisosPerfil('chofer', ['viajes'], 'admin@example.com'), error => error.statusCode === 400);
      await assert.rejects(actualizarPermisosPerfil('operador_seguridad', [], 'admin@example.com'), error => error.statusCode === 400);
      const created = await crearPerfil('supervisor', 'Supervisor', ['viajes'], 'admin@example.com');
      assert.equal(created.perfil, 'company-a:supervisor');
      await assert.rejects(crearPerfil('supervisor', 'Otro', [], 'admin@example.com'), error => error.statusCode === 409);
      await actualizarPermisosPerfil('supervisor', ['camiones'], 'admin@example.com', 'Supervisor de flota');
      assert.deepEqual((await permisosPorPerfil()).supervisor, ['camiones']);
      assigned = true;
      await assert.rejects(eliminarPerfil('supervisor', 'admin@example.com'), error => error.statusCode === 409);
      assigned = false;
      await eliminarPerfil('supervisor', 'admin@example.com');
      assert.equal((await permisosPorPerfil()).supervisor, undefined);
      await assert.rejects(eliminarPerfil('operador_seguridad', 'admin@example.com'), error => error.statusCode === 400);
    });
  } finally { PerfilModel.find = original.find; PerfilModel.findOneAndUpdate = original.update; PerfilModel.create = original.create; Usuario.exists = original.exists; }
});
