const assert = require('node:assert/strict');
const { test } = require('node:test');
const { randomUUID } = require('node:crypto');
const { cargaCombustibleSchema } = require('../src/modules/viajes/viajes.combustible');
const { ViajesService } = require('../src/modules/viajes/viajes.service');
const { ViajeInternacionalModel } = require('../src/modules/viajes/viajes.model');
const { CamionModel } = require('../src/modules/camiones/camiones.model');

const fuel = {
    registroId: randomUUID(), camionId: '123456789012345678901234',
    importe: 12.35, moneda: 'USD', fecha: '2026-11-11',
};

test('fuel validates currency, date, truck identifier and positive two-decimal amount', () => {
    assert.deepEqual(cargaCombustibleSchema.parse(fuel), fuel);
    for (const invalid of [
        { moneda: 'EUR' }, { fecha: '2026-02-30' }, { camionId: 'x' },
        { importe: 0 }, { importe: -1 }, { importe: 12.345 },
    ]) assert.equal(cargaCombustibleSchema.safeParse({ ...fuel, ...invalid }).success, false);
});

test('concurrent trip fuel retries use one atomic append and preserve the truck plate', async (t) => {
    const tripId = '234567890123456789012345';
    const trip = { _id: tripId, cargasCombustible: [] };
    t.mock.method(ViajeInternacionalModel, 'findById', async () => structuredClone(trip));
    t.mock.method(CamionModel, 'findById', id => ({
        select: () => ({ lean: async () => id === fuel.camionId ? { patente: 'AA123BB' } : null }),
    }));
    t.mock.method(ViajeInternacionalModel, 'findOneAndUpdate', async (filter, update) => {
        const carga = update.$push.cargasCombustible;
        assert.deepEqual(filter, { _id: tripId, 'cargasCombustible.registroId': { $ne: carga.registroId } });
        if (trip.cargasCombustible.some(row => row.registroId === carga.registroId)) return null;
        trip.cargasCombustible.push(carga);
        return structuredClone(trip);
    });

    const service = new ViajesService('internacional');
    const results = await Promise.all([service.addFuel(tripId, fuel), service.addFuel(tripId, fuel)]);
    for (const result of results) assert.deepEqual(result.cargasCombustible, [{ ...fuel, patente: 'AA123BB' }]);
    await assert.rejects(service.addFuel(tripId, { ...fuel, importe: 25 }), { statusCode: 409 });
    await assert.rejects(service.addFuel(tripId, {
        ...fuel, registroId: randomUUID(), camionId: 'ffffffffffffffffffffffff',
    }), { statusCode: 404 });
});

test('trip margin uses original currencies and avoids settlement and conversion duplicates', async () => {
    const { tripMargin } = await import('../../frontend/src/lib/trip-margin.mjs');
    const trip = {
        tarifaTotalAr: 1000, tarifaTotalUsd: 100,
        tarifaChoferAr: 100, tarifaChoferUsd: 10, tarifaChoferUsdAr: 12000,
        estadiaAr: 50, estadiaCh: 500, totalChofer: 13000,
        peajeAr: 15, peajeCh: 125, viaticoArgentino: 100, viaticoChileno: 1000,
        adelantoAr: 500, subtotal: 12900, pago: 12400,
        cargasCombustible: [fuel, { ...fuel, importe: 25, moneda: 'ARS' }],
    };
    assert.deepEqual(
        tripMargin(trip).map(({ currency, cost, margin }) => [currency, cost, margin]),
        [['ARS', 19000, 81000], ['USD', 2235, 7765], ['CLP', 62500, null]],
    );
    assert.equal(tripMargin({ tarifaTotalAr: 100, totalChofer: 30 })[0].margin, 7000);
    assert.equal(tripMargin({ tarifaTotalAr: 100, direccion_facturacion: 'recibida' })[0].cost, 10000);
    assert.deepEqual(tripMargin({}), []);
});
