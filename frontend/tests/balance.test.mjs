import test from 'node:test';
import assert from 'node:assert/strict';
import { amounts, summarize } from '../src/lib/balance.mjs';

test('partial and overdue payments retain only the unpaid remainder', () => {
  assert.deepEqual(amounts({ monto: 100.25, monto_pagado: 40, estado: 'vencido' }), { total: 10025, paid: 4000, pending: 6025 });
  assert.equal(amounts({ monto: 100.25, estado: 'cobrado' }).pending, 0);
});

test('credit notes reduce billing and retain cent precision', () => {
  const result = summarize([
    { direction: 'emitida', monto: 100.25, monto_pagado: 40 },
    { direction: 'emitida', monto: 10.10, tipo_comprobante: 'nota_credito' },
    { direction: 'recibida', monto: 60, estado: 'pagado' },
  ]);
  assert.equal(result.balance, 3015);
  assert.equal(result.cash, -2000);
  assert.equal(result.receivable, 5015);
  assert.equal(result.payable, 0);
  assert.equal(result.pending, 5015);
});
