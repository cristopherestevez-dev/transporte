import { test } from 'node:test';
import assert from 'node:assert/strict';
import { destinationForProfile, firstAllowedRoute } from '../src/lib/access.mjs';
test('switching to driver redirects administrative views to the first driver view', () => {
  assert.equal(destinationForProfile(['mi-camion', 'mis-viajes'], '/dashboard'), '/mis-viajes');
  assert.equal(destinationForProfile(['mis-viajes', 'mi-camion'], '/viajes/nacionales/123'), '/mis-viajes');
  assert.equal(destinationForProfile(['mi-camion'], '/facturacion'), '/mi-camion');
});
test('switching profiles preserves permitted views and billing aliases', () => {
  assert.equal(destinationForProfile(['camiones', 'dashboard'], '/camiones/123?tab=servicios'), '/camiones/123?tab=servicios');
  assert.equal(destinationForProfile(['facturacion'], '/balance'), '/balance');
  assert.equal(destinationForProfile(['facturacion'], '/balance?desde=2026-10-01'), '/balance?desde=2026-10-01');
  assert.equal(destinationForProfile(['dashboard', 'viajes'], '/mi-camion'), '/dashboard');
});
test('profiles without permissions get a dedicated page without redirect loops', () => {
  assert.equal(firstAllowedRoute([]), '/sin-acceso');
});
