import { IViaje } from '../viajes/viajes.model';
import { AppError } from '../../shared/errors/AppError';

export const monedas = ['ARS', 'CLP', 'USD'] as const;
export type Moneda = typeof monedas[number];
export type Saldos = Record<Moneda, number>;

export function saldosViaje(viaje: Partial<IViaje>): Saldos {
    const adelanto = viaje.adelantoMonto ?? viaje.adelantoAr ?? 0;
    const moneda = viaje.adelantoMonto == null ? 'ARS' : (viaje.adelantoMoneda || 'ARS');
    if (adelanto && !monedas.some(value => value === moneda)) {
        throw new AppError('Un viaje tiene un adelanto con moneda inválida', 422);
    }

    // Las conversiones guardadas para el pago individual no forman parte del saldo por moneda.
    const { tarifaChoferAr, tarifaChoferUsd, tarifaChoferPorcentaje = 10 } = viaje;
    // Para fleteros, la tarifa del flete puede ser el total de una factura recibida.
    const porcentaje = viaje.tipoAsignacion === 'fletero' ? 0 : tarifaChoferPorcentaje;
    const comisionAr = tarifaChoferAr ?? (viaje.tarifaTotalAr ?? 0) * porcentaje / 100;
    const comisionUsd = tarifaChoferUsd ?? (viaje.tarifaTotalUsd ?? 0) * porcentaje / 100;
    const restoAr = viaje.restoAr ?? (viaje.viaticoArgentino ?? 0) - (viaje.peajeAr ?? 0) - (viaje.devolAr ?? 0);
    const restoCh = viaje.restoCh ?? (viaje.viaticoChileno ?? 0) - (viaje.peajeCh ?? 0) - (viaje.devolCh ?? 0);
    const saldo = {
        ARS: comisionAr + (viaje.estadiaAr ?? 0) - restoAr,
        CLP: (viaje.estadiaCh ?? 0) - restoCh,
        USD: comisionUsd,
    };

    return {
        ARS: enCentavos(saldo.ARS - (moneda === 'ARS' ? adelanto : 0)),
        CLP: enCentavos(saldo.CLP - (moneda === 'CLP' ? adelanto : 0)),
        USD: enCentavos(saldo.USD - (moneda === 'USD' ? adelanto : 0)),
    };
}

export function enCentavos(importe: number): number {
    const centavos = Math.sign(importe) * Math.round((Math.abs(importe) + Number.EPSILON) * 100);
    if (!Number.isSafeInteger(centavos)) throw new AppError('Importe fuera del rango permitido', 422);
    return centavos || 0;
}