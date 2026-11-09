import { describe, expect, it } from 'vitest';
import { compararConMesAnterior, desglosePorCategoria, proyeccionFinDeMes, resumirMovimientos } from './estadisticasMes';
import { claveMes } from './fechas';
import { buscador, categoria, gastoAnual, movimiento } from './pruebasDatos';

const mercado = categoria('mercado', 'egreso', 'esencial');
const arriendo = categoria('arriendo', 'egreso', 'esencial', true);
const educacion = categoria('educacion', 'egreso', 'esencial');
const porId = buscador([mercado, arriendo, educacion]);

const NOVIEMBRE = new Date(2026, 10, 1);
const OCTUBRE = new Date(2026, 9, 1);

describe('compararConMesAnterior (C1)', () => {
  it('compara el mes en curso a igual fecha y solo el gasto variable', () => {
    const hoy = new Date(2026, 10, 9, 15);
    const transacciones = [
      // Octubre: 700.000 variables del 1 al 9, 2.400.000 en todo el mes.
      movimiento(new Date(2026, 9, 1, 10), 400_000, 'mercado'),
      movimiento(new Date(2026, 9, 9, 18), 300_000, 'mercado'),
      movimiento(new Date(2026, 9, 20, 12), 1_700_000, 'mercado'),
      // Los fijos no cuentan.
      movimiento(new Date(2026, 9, 1, 9), 1_200_000, 'arriendo'),
      movimiento(new Date(2026, 10, 1, 9), 1_200_000, 'arriendo'),
      // Noviembre del 1 al 9: 900.000 variables.
      movimiento(new Date(2026, 10, 2, 12), 500_000, 'mercado'),
      movimiento(new Date(2026, 10, 9, 8), 400_000, 'mercado'),
    ];
    const resultado = compararConMesAnterior(transacciones, NOVIEMBRE, porId, hoy);
    expect(resultado).not.toBeNull();
    expect(resultado?.anterior).toBe(700_000);
    expect(resultado?.actual).toBe(900_000);
    expect(resultado?.deltaPorcentaje).toBeCloseTo(28.6, 1);
    expect(resultado?.corte).toBe(9);
  });

  it('un gasto del 31-oct a las 21:00 en Colombia cuenta en octubre', () => {
    const gastoTarde = movimiento(new Date(2026, 9, 31, 21), 250_000, 'mercado');
    // En UTC ya es noviembre: por eso no se puede usar fecha.slice(0, 7).
    expect(gastoTarde.fecha.slice(0, 7)).toBe('2026-11');
    expect(claveMes(gastoTarde.fecha)).toBe('2026-10');

    const transacciones = [movimiento(new Date(2026, 8, 1, 10), 100_000, 'mercado'), gastoTarde];
    const resultado = compararConMesAnterior(transacciones, OCTUBRE, porId, new Date(2026, 10, 9));
    expect(resultado?.actual).toBe(250_000);
    expect(resultado?.corte).toBeNull();
  });

  it('no compara si el mes anterior está incompleto', () => {
    const transacciones = [
      movimiento(new Date(2026, 9, 15, 10), 300_000, 'mercado'),
      movimiento(new Date(2026, 10, 3, 10), 200_000, 'mercado'),
    ];
    expect(compararConMesAnterior(transacciones, NOVIEMBRE, porId, new Date(2026, 10, 9))).toBeNull();
  });

  it('una categoría borrada cuenta como gasto variable', () => {
    const transacciones = [
      movimiento(new Date(2026, 9, 1, 10), 100_000, 'borrada'),
      movimiento(new Date(2026, 10, 1, 10), 150_000, 'borrada'),
    ];
    const resultado = compararConMesAnterior(transacciones, NOVIEMBRE, porId, new Date(2026, 10, 9));
    expect(resultado?.deltaPorcentaje).toBeCloseTo(50, 5);
  });

  it('pagar la matrícula en enero no sube la comparación (A4)', () => {
    const matricula = gastoAnual('Matrícula', 1_800_000, 1, 'educacion');
    const transacciones = [
      movimiento(new Date(2026, 11, 1, 10), 500_000, 'mercado'),
      movimiento(new Date(2027, 0, 5, 10), 500_000, 'mercado'),
      movimiento(new Date(2027, 0, 10, 10), 1_800_000, 'educacion'),
    ];
    const resultado = compararConMesAnterior(transacciones, new Date(2027, 0, 1), porId, new Date(2027, 1, 3), [matricula]);
    expect(resultado?.actual).toBe(500_000);
    expect(resultado?.deltaPorcentaje).toBe(0);
  });
});

describe('proyeccionFinDeMes (C2)', () => {
  it('no proyecta antes del día 7', () => {
    const transacciones = [
      movimiento(new Date(2026, 10, 1, 9), 1_200_000, 'arriendo'),
      movimiento(new Date(2026, 10, 2, 9), 60_000, 'mercado'),
    ];
    expect(proyeccionFinDeMes(transacciones, porId, NOVIEMBRE, new Date(2026, 10, 3))).toBeNull();
  });

  it('suma los fijos sin extrapolarlos', () => {
    const transacciones = [
      movimiento(new Date(2026, 10, 1, 9), 1_200_000, 'arriendo'),
      movimiento(new Date(2026, 10, 4, 9), 500_000, 'mercado'),
    ];
    expect(proyeccionFinDeMes(transacciones, porId, NOVIEMBRE, new Date(2026, 10, 10))).toBe(2_700_000);
  });

  it('no proyecta meses que no son el actual', () => {
    expect(proyeccionFinDeMes([], porId, OCTUBRE, new Date(2026, 10, 10))).toBeNull();
  });
});

describe('contabilidad por naturaleza en las estadísticas (B2)', () => {
  const salario = categoria('salario', 'ingreso', 'ordinario');
  const ahorro = categoria('ahorro', 'egreso', 'ahorro');
  const tarjeta = categoria('tarjeta', 'egreso', 'pago_tarjeta');
  const porIdB2 = buscador([mercado, salario, ahorro, tarjeta]);

  it('el ahorro no sube la proporción gastada', () => {
    const transacciones = [
      movimiento(new Date(2026, 10, 1), 2_500_000, 'salario', 'ingreso'),
      movimiento(new Date(2026, 10, 2), 500_000, 'ahorro'),
      movimiento(new Date(2026, 10, 3), 1_600_000, 'mercado'),
    ];
    const resumen = resumirMovimientos(transacciones, porIdB2);
    expect(resumen.neto).toBe(400_000);
    expect(resumen.proporcionGastada).toBeCloseTo(0.64, 5);
    expect(resumen.estado).toBe('bien');
  });

  it('la dona no muestra ahorro ni pago de tarjeta', () => {
    const transacciones = [
      movimiento(new Date(2026, 10, 2), 500_000, 'ahorro'),
      movimiento(new Date(2026, 10, 3), 800_000, 'tarjeta'),
      movimiento(new Date(2026, 10, 4), 100_000, 'mercado'),
    ];
    const segmentos = desglosePorCategoria(transacciones, porIdB2, 'egreso');
    expect(segmentos.map((s) => s.categoriaId)).toEqual(['mercado']);
    expect(segmentos[0].porcentaje).toBe(100);
  });
});
