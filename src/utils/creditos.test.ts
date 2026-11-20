import { describe, expect, it } from 'vitest';
import type { Credito } from '../types';
import { costoPorMil, describirProximaCuota, estadosCreditos, fechaDeCuota, fechaPrimeraCuotaDesdeProxima, resumirCreditos, segmentosCredito, tablaAmortizacion, tasaEfectivaAnual, tasaMensualDeCredito } from './creditos';
import { clasificar, esGasto } from './contabilidad';
import { desglosePorCategoria, fijoVsVariable } from './estadisticasMes';
import { buscador, categoria, movimiento } from './pruebasDatos';

const moto: Credito = {
  id: 'c1',
  nombre: 'Moto',
  entidad: 'Banco',
  montoFinanciado: 12_000_000,
  cuota: 700_000,
  plazoMeses: 24,
  cuotasPagadasInicial: 0,
  fechaPrimeraCuota: '2026-01-05',
};

const pagoDe = (fecha: Date) => movimiento(fecha, 700_000, '', 'egreso', null, 'c1');

describe('tasa del crédito', () => {
  it('recupera la tasa de un crédito conocido: 10 millones a 12 meses al 1 % mensual', () => {
    const tasa = tasaMensualDeCredito({ montoFinanciado: 10_000_000, cuota: 888_488, plazoMeses: 12 });
    expect(Math.abs(tasa - 0.01) < 0.000001).toBe(true);
    expect(Math.abs(tasaEfectivaAnual(0.01) - 12.6825) < 0.001).toBe(true);
  });

  it('sin intereses (cuotas que solo devuelven lo prestado) la tasa es 0', () => {
    expect(tasaMensualDeCredito({ montoFinanciado: 2_400_000, cuota: 100_000, plazoMeses: 24 })).toBe(0);
  });
});

describe('tabla de amortización', () => {
  const tabla = tablaAmortizacion(moto);

  it('la moto: 24 cuotas de 700.000 suman 16.800.000 y 4.800.000 son intereses', () => {
    const total = tabla.reduce((acc, f) => acc + f.cuota, 0);
    const intereses = tabla.reduce((acc, f) => acc + f.interes, 0);
    expect(Math.round(total)).toBe(16_800_000);
    expect(Math.round(intereses)).toBe(4_800_000);
  });

  it('termina la deuda en cero y los intereses bajan con los meses', () => {
    expect(tabla[tabla.length - 1].saldo).toBe(0);
    expect(tabla[0].interes > tabla[11].interes).toBe(true);
    expect(tabla[0].capital < tabla[23].capital).toBe(true);
  });

  it('cada cuota es intereses más capital', () => {
    for (const fila of tabla) expect(Math.abs(fila.interes + fila.capital - fila.cuota) < 0.001).toBe(true);
  });
});

describe('fechas de las cuotas', () => {
  it('una cuota del 31 cae el último día de los meses cortos sin arrastrarlo', () => {
    expect(fechaDeCuota('2026-01-31', 1)).toBe('2026-01-31');
    expect(fechaDeCuota('2026-01-31', 2)).toBe('2026-02-28');
    expect(fechaDeCuota('2026-01-31', 3)).toBe('2026-03-31');
    expect(fechaDeCuota('2026-01-31', 4)).toBe('2026-04-30');
  });

  it('pasa de año', () => {
    expect(fechaDeCuota('2026-11-15', 3)).toBe('2027-01-15');
  });

  it('la primera cuota sale de la próxima y de cuántas lleva pagadas', () => {
    expect(fechaPrimeraCuotaDesdeProxima('2026-04-05', 3)).toBe('2026-01-05');
    expect(fechaPrimeraCuotaDesdeProxima('2026-12-05', 0)).toBe('2026-12-05');
  });
});

describe('estado del crédito', () => {
  const pagos = [pagoDe(new Date(2026, 0, 5)), pagoDe(new Date(2026, 1, 5)), pagoDe(new Date(2026, 2, 4))];

  it('cuenta las cuotas pagadas, lo pagado y lo que falta', () => {
    const [e] = estadosCreditos([moto], pagos, new Date(2026, 3, 2));
    expect(e.cuotasPagadas).toBe(3);
    expect(e.cuotasRestantes).toBe(21);
    expect(e.totalPagado).toBe(2_100_000);
    expect(e.porPagar).toBe(14_700_000);
    expect(e.progreso).toBe(3 / 24);
  });

  it('intereses pagados + por pagar = intereses totales', () => {
    const [e] = estadosCreditos([moto], pagos, new Date(2026, 3, 2));
    expect(Math.round(e.interesesPagados + e.interesesPorPagar)).toBe(4_800_000);
    expect(Math.round(e.capitalPagado + e.saldoCapital)).toBe(12_000_000);
    expect(e.interesesPagados > 0 && e.interesesPagados < e.interesesTotal).toBe(true);
  });

  it('la próxima cuota es la 4, vence el 5 de abril y a 2-abr aún no está vencida', () => {
    const [e] = estadosCreditos([moto], pagos, new Date(2026, 3, 2));
    expect(e.proximaCuota?.numero).toBe(4);
    expect(e.proximaCuota?.fecha).toBe('2026-04-05');
    expect(e.diasParaProxima).toBe(3);
    expect(e.vencida).toBe(false);
  });

  it('pasada la fecha sin pagar está vencida y cuenta los días', () => {
    const [e] = estadosCreditos([moto], pagos, new Date(2026, 3, 9));
    expect(e.vencida).toBe(true);
    expect(e.diasVencida).toBe(4);
  });

  it('las cuotas que ya estaban pagadas al empezar cuentan como pagadas a su valor', () => {
    const [e] = estadosCreditos([{ ...moto, cuotasPagadasInicial: 10 }], [pagoDe(new Date(2026, 10, 5))], new Date(2026, 10, 9));
    expect(e.cuotasPagadas).toBe(11);
    expect(e.totalPagado).toBe(7_700_000);
  });

  it('al pagar todas queda saldado, sin próxima cuota ni deuda', () => {
    const todas = Array.from({ length: 24 }, (_, i) => pagoDe(new Date(2026, i, 5)));
    const [e] = estadosCreditos([moto], todas, new Date(2028, 1, 1));
    expect(e.saldado).toBe(true);
    expect(e.proximaCuota).toBeNull();
    expect(e.saldoCapital).toBe(0);
    expect(e.vencida).toBe(false);
    expect(Math.round(e.interesesPagados)).toBe(4_800_000);
  });

  it('los pagos de otro crédito no cuentan', () => {
    const ajeno = movimiento(new Date(2026, 0, 5), 700_000, '', 'egreso', null, 'otro');
    const [e] = estadosCreditos([moto], [ajeno], new Date(2026, 3, 2));
    expect(e.cuotasPagadas).toBe(0);
  });
});

describe('resumen y costo', () => {
  it('suma lo que falta, los intereses y las cuotas del mes', () => {
    const estados = estadosCreditos([moto], [pagoDe(new Date(2026, 0, 5))], new Date(2026, 1, 2));
    const resumen = resumirCreditos(estados, new Date(2026, 1, 2));
    expect(resumen.porPagar).toBe(23 * 700_000);
    expect(resumen.activos).toBe(1);
    expect(resumen.cuotasDelMes).toBe(700_000);
    expect(Math.round(resumen.interesesPagados + resumen.interesesPorPagar)).toBe(4_800_000);
  });

  it('por cada $1.000 prestados la moto cuesta $1.400', () => {
    const [e] = estadosCreditos([moto], [], new Date(2026, 0, 1));
    expect(costoPorMil(e)).toBe(1400);
  });
});

describe('el pago de una cuota en las cuentas', () => {
  const pago = pagoDe(new Date(2026, 0, 5));
  const cena = movimiento(new Date(2026, 0, 6), 50_000, 'comida', 'egreso');
  const categorias = buscador([categoria('comida', 'egreso', 'esencial')]);

  it('cuenta como gasto de deuda, no como préstamo ni como gasto de categoría', () => {
    expect(clasificar(pago)).toBe('gasto_deuda');
    expect(esGasto(clasificar(pago))).toBe(true);
  });

  it('en la dona sale en su propio segmento "Cuota de crédito"', () => {
    const segmentos = desglosePorCategoria([pago, cena], categorias, 'egreso');
    const cuota = segmentos.find((s) => s.categoriaId === 'credito');
    expect(cuota?.nombre).toBe('Cuota de crédito');
    expect(cuota?.monto).toBe(700_000);
    expect(segmentos.length).toBe(2);
  });

  it('es un gasto fijo', () => {
    const { fijo, variable } = fijoVsVariable([pago, cena], categorias);
    expect(fijo).toBe(700_000);
    expect(variable).toBe(50_000);
  });
});

describe('describirProximaCuota', () => {
  const tresPagos = [pagoDe(new Date(2026, 0, 5)), pagoDe(new Date(2026, 1, 5)), pagoDe(new Date(2026, 2, 4))];
  const textoEn = (hoy: Date, credito: Credito = moto, pagos = tresPagos) =>
    describirProximaCuota(estadosCreditos([credito], pagos, hoy)[0], hoy);

  it('dice el mes de la siguiente cuota, sin el día', () => {
    expect(textoEn(new Date(2026, 3, 2))).toEqual({ texto: 'Siguiente cuota es de abril', tono: 'pronto' });
    expect(textoEn(new Date(2026, 3, 1)).tono).toBe('pronto');
  });

  it('lejos de la fecha el tono es tranquilo', () => {
    expect(textoEn(new Date(2026, 2, 10)).tono).toBe('tranquilo');
  });

  it('pasada la fecha dice que la cuota de ese mes está atrasada', () => {
    expect(textoEn(new Date(2026, 3, 9))).toEqual({ texto: 'La cuota de abril está atrasada', tono: 'vencido' });
  });

  it('si la cuota es de otro año lo dice', () => {
    const casi = { ...moto, cuotasPagadasInicial: 12 };
    expect(textoEn(new Date(2026, 11, 20), casi, []).texto).toBe('Siguiente cuota es de enero de 2027');
  });

  it('saldado dice que el crédito está pagado', () => {
    const todas = Array.from({ length: 24 }, (_, i) => pagoDe(new Date(2026, i, 5)));
    expect(textoEn(new Date(2028, 1, 1), moto, todas)).toEqual({ texto: 'Crédito pagado', tono: 'pagado' });
  });
});

describe('segmentosCredito', () => {
  const tresPagos = [pagoDe(new Date(2026, 0, 5)), pagoDe(new Date(2026, 1, 5)), pagoDe(new Date(2026, 2, 4))];
  const segmentosEn = (hoy: Date, pagos = tresPagos) => segmentosCredito(estadosCreditos([moto], pagos, hoy)[0], hoy);

  it('muestra qué mes toca, cuántas faltan y cuándo termina', () => {
    expect(segmentosEn(new Date(2026, 3, 2))).toEqual([
      { etiqueta: 'Próxima', valor: 'Abril', tono: 'normal' },
      { etiqueta: 'Faltan', valor: '21 cuotas', tono: 'normal' },
      { etiqueta: 'Termina', valor: 'Dic 2027', tono: 'normal' },
    ]);
  });

  it('atrasada marca el primero en alerta', () => {
    const [primero] = segmentosEn(new Date(2026, 3, 9));
    expect(primero).toEqual({ etiqueta: 'Atrasada', valor: 'Abril', tono: 'alerta' });
  });

  it('la última cuota dice "1 cuota" en singular', () => {
    const casi = Array.from({ length: 23 }, (_, i) => pagoDe(new Date(2026, i, 5)));
    expect(segmentosEn(new Date(2027, 11, 1), casi)[1].valor).toBe('1 cuota');
  });

  it('saldado muestra el estado pagado', () => {
    const todas = Array.from({ length: 24 }, (_, i) => pagoDe(new Date(2026, i, 5)));
    expect(segmentosEn(new Date(2028, 1, 1), todas)).toEqual([
      { etiqueta: 'Estado', valor: 'Pagado', tono: 'ingreso' },
      { etiqueta: 'Cuotas', valor: '24 de 24', tono: 'normal' },
      { etiqueta: 'Terminó', valor: 'Dic 2027', tono: 'normal' },
    ]);
  });
});
