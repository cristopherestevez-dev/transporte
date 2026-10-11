const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { allowedNotificationTypes, getPreferences, savePreferences } = require('../src/modules/notifications/notifications.preferences');
const { NotificationRepository } = require('../src/modules/notifications/notifications.repository');
const { NotificationModel } = require('../src/modules/notifications/notifications.model');
const { tenantContext } = require('../src/shared/tenant');
const { NotificationRule, notificationOptions } = require('../src/modules/notifications/notifications.rules');
const { Preferences, saveRulePreferences } = require('../src/modules/notifications/notifications.preferences');
const { NotificationDelivery } = require('../src/modules/notifications/notifications.delivery');

test('preferences expose each company rule by name and store choices independently for duplicate events', async () => {
  const original = { rules: NotificationRule.find, find: Preferences.findOne, save: Preferences.findOneAndUpdate, deliveries: NotificationDelivery.updateMany };
  let saved = { disabledTypes: [], disabledRuleIds: [] };
  try {
    const rules = notificationOptions.map(option => ({ _id: option.type, type: option.type, name: option.label, active: true, profiles: ['logistica'], channels: ['web'] }));
    rules.push({ _id: 'new-trip-rule', type: 'VIAJE_ESTADO', name: 'Mi nueva regla de viajes', active: true, allProfiles: true, profiles: [], channels: ['web'] });
    NotificationRule.find = async () => rules;
    Preferences.findOne = async () => saved;
    Preferences.findOneAndUpdate = async (filter, update) => { saved = update.$set; };
    NotificationDelivery.updateMany = async () => {};
    await tenantContext.run({ empresaId: 'a' }, async () => {
      const options = await getPreferences('u', 'logistica', 'a', ['viajes']);
      assert.equal(options.length, 2);
      assert.equal(options[1].label, 'Mi nueva regla de viajes');
      const updated = await saveRulePreferences('u', 'logistica', 'a', ['viajes'], ['new-trip-rule']);
      assert.equal(updated[0].enabled, false);
      assert.equal(updated[1].enabled, true);
      await assert.rejects(saveRulePreferences('u', 'logistica', 'a', ['viajes'], ['SEGURO']), error => error.statusCode === 400);
      rules.push({ _id: 'third-trip-rule', type: 'VIAJE_ESTADO', name: 'Regla agregada después', active: true, allProfiles: true, profiles: [], channels: ['web'] });
      assert.equal((await getPreferences('u', 'logistica', 'a', ['viajes']))[2].enabled, true);
    });
  } finally { NotificationRule.find = original.rules; Preferences.findOne = original.find; Preferences.findOneAndUpdate = original.save; NotificationDelivery.updateMany = original.deliveries; }
});

test('notification preferences are isolated by user, company and active profile and reject unauthorized types', async () => {
  const model = mongoose.model('NotificationPreferences');
  const original = { find: model.findOne, update: model.findOneAndUpdate };
  const records = new Map();
  try {
    model.findOne = async filter => records.get(JSON.stringify(filter));
    model.findOneAndUpdate = async (filter, update) => records.set(JSON.stringify(filter), update.$set);
    await savePreferences('u1', 'logistica', 'a', ['camiones'], []);
    assert.equal((await getPreferences('u1', 'logistica', 'a', ['camiones']))[0].enabled, false);
    for (const [user, profile, company] of [['u2', 'logistica', 'a'], ['u1', 'admin', 'a'], ['u1', 'logistica', 'b']]) {
      assert.equal((await getPreferences(user, profile, company, ['camiones']))[0].enabled, true);
    }
    await assert.rejects(savePreferences('u1', 'logistica', 'a', ['camiones'], ['PAGO']), error => error.statusCode === 400);
    assert.deepEqual(allowedNotificationTypes(['dashboard']), []);
    assert.deepEqual(allowedNotificationTypes(['facturacion']), ['COBRANZA', 'PAGO']);
    // A temporary permission removal must not erase the user's previous preference.
    await savePreferences('u1', 'logistica', 'a', [], []);
    assert.equal((await getPreferences('u1', 'logistica', 'a', ['camiones']))[0].enabled, false);
  } finally { model.findOne = original.find; model.findOneAndUpdate = original.update; }
});

test('notification visibility requires the type permission and excludes notifications addressed to other users', async () => {
  const original = NotificationModel.find;
  try {
    NotificationModel.find = filter => {
      assert.deepEqual(filter.type.$in, ['SEGURO']);
      assert.deepEqual(filter.$or, [{ userId: 'u1' }, { userId: { $exists: false } }, { userId: null }]);
      assert.deepEqual(filter.readBy, { $ne: 'u1' });
      return { sort: async () => [] };
    };
    await new NotificationRepository().findByUserOrRole('u1', ['camiones']);
  } finally { NotificationModel.find = original; }
});
