const { test } = require('node:test');
const assert = require('node:assert/strict');
const { tenantContext } = require('../src/shared/tenant');
const { NotificationRule, writeRule } = require('../src/modules/notifications/notifications.rules');
const { PerfilModel } = require('../src/modules/usuarios/perfiles.service');
const { ViajeNacionalModel } = require('../src/modules/viajes/viajes.model');
const { ViajesRepository } = require('../src/modules/viajes/viajes.repository');
const { listRules, notificationOptions } = require('../src/modules/notifications/notifications.rules');
const { Usuario } = require('../src/modules/usuarios/usuarios.model');
const { Preferences } = require('../src/modules/notifications/notifications.preferences');
const { NotificationDelivery, queueMobileDeliveries } = require('../src/modules/notifications/notifications.delivery');

test('company rules validate destinations and scope every write to the authenticated company', async () => {
  const original = { profiles: PerfilModel.find, find: NotificationRule.findOne, update: NotificationRule.findOneAndUpdate, create: NotificationRule.create };
  try {
    PerfilModel.find = async () => [];
    NotificationRule.findOne = async filter => { assert.equal(filter.empresaId, 'company-a'); return null; };
    NotificationRule.create = async data => { assert.equal(data.empresaId, 'company-a'); return data; };
    await tenantContext.run({ empresaId: 'company-a' }, async () => {
      const rule = { name: 'Cambio de viaje', type: 'VIAJE_ESTADO', profiles: ['operador_logistico'], channels: ['web', 'mobile'], active: true, empresaId: 'company-b' };
      await writeRule(undefined, rule);
      await writeRule(undefined, rule);
      const all = await writeRule(undefined, { ...rule, allProfiles: true, profiles: [] });
      assert.equal(all.allProfiles, true);
      await assert.rejects(writeRule(undefined, { ...rule, profiles: ['unknown'] }), error => error.statusCode === 400);
      await assert.rejects(writeRule(undefined, { ...rule, channels: ['email'] }), error => error.statusCode === 400);
      await assert.rejects(writeRule(undefined, { ...rule, type: 'UNKNOWN' }), error => error.statusCode === 400);
    });
    await assert.rejects(writeRule(undefined, {}), error => error.statusCode === 403);
  } finally { PerfilModel.find = original.profiles; NotificationRule.findOne = original.find; NotificationRule.findOneAndUpdate = original.update; NotificationRule.create = original.create; }
});

test('trip state changes atomically save one durable event; unchanged states produce none and concurrent edits fail', async () => {
  const original = { find: ViajeNacionalModel.findById, update: ViajeNacionalModel.findOneAndUpdate };
  try {
    const repository = new ViajesRepository('nacional');
    ViajeNacionalModel.findById = async () => ({ estado: 'pendiente' });
    ViajeNacionalModel.findOneAndUpdate = async (filter, update) => {
      assert.equal(filter.estado, 'pendiente');
      assert.equal(update.$set.estado, 'en_transito');
      assert.equal(update.$push.notificationEvents.previous, 'pendiente');
      assert.equal(update.$push.notificationEvents.current, 'en_transito');
      assert.ok(update.$push.notificationEvents.eventId);
      return { estado: 'en_transito' };
    };
    await repository.update('trip', { estado: 'en_transito' });
    ViajeNacionalModel.findOneAndUpdate = async (filter, update) => { assert.equal(update.$push, undefined); return { estado: 'pendiente' }; };
    await repository.update('trip', { estado: 'pendiente' });
    ViajeNacionalModel.findOneAndUpdate = async () => null;
    await assert.rejects(repository.update('trip', { estado: 'cancelado' }), error => error.statusCode === 409);
  } finally { ViajeNacionalModel.findById = original.find; ViajeNacionalModel.findOneAndUpdate = original.update; }
});

test('rule administration is reserved to company security even when another profile has configuration permission', async () => {
  const express = require('express');
  const router = require('../src/modules/notifications/notifications.rules.routes').default;
  const app = express();
  app.use((req, res, next) => { req.user = { role: req.headers['x-profile'], empresaId: 'company-a', permisos: ['configuracion'] }; next(); });
  app.use(router);
  app.use((error, req, res, next) => res.status(error.statusCode || 500).json({ message: error.message }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    for (const profile of ['operador_logistico', 'superadmin']) {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/`, { headers: { 'x-profile': profile } });
      assert.equal(response.status, 403);
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('mobile outbox targets only company users with an eligible profile and enabled preferences', async () => {
  const original = { rules: NotificationRule.find, profiles: PerfilModel.find, users: Usuario.find, preferences: Preferences.findOne, queue: NotificationDelivery.updateOne };
  const queued = [];
  try {
    NotificationRule.find = async filter => {
      assert.equal(filter.empresaId, 'company-a');
      return notificationOptions.map(option => ({ _id: option.type, type: option.type, active: true, profiles: ['operador_logistico', 'operador_administrativo'], channels: ['web', 'mobile'] }));
    };
    PerfilModel.find = async () => [];
    Usuario.find = async filter => {
      assert.equal(filter.empresaId, 'company-a'); assert.equal(filter.activo, true);
      return [{ _id: 'u1', perfiles: ['operador_logistico', 'operador_administrativo'] }, { _id: 'u2', perfiles: ['operador_logistico'] }];
    };
    Preferences.findOne = async filter => ({ disabledTypes: filter.userId === 'u2' ? ['VIAJE_ESTADO'] : [] });
    NotificationDelivery.updateOne = async (filter, update, options) => {
      assert.equal(options.upsert, true);
      assert.equal(update.$setOnInsert.empresaId, 'company-a');
      assert.equal(update.$setOnInsert.status, 'pending');
      queued.push(filter);
    };
    await tenantContext.run({ empresaId: 'company-a' }, () => queueMobileDeliveries({ _id: 'event', type: 'VIAJE_ESTADO', title: 'Cambio', message: 'En tránsito', link: '/viajes/nacional/trip' }));
    assert.deepEqual(queued, [{ notificationId: 'event', userId: 'u1', perfil: 'operador_logistico', channel: 'mobile' }]);
  } finally {
    NotificationRule.find = original.rules; PerfilModel.find = original.profiles; Usuario.find = original.users; Preferences.findOne = original.preferences; NotificationDelivery.updateOne = original.queue;
  }
});
