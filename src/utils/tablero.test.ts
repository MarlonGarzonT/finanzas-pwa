import { describe, expect, it } from 'vitest';
import { aniosConDatos, mayoresGastos, repartoDelMes, serieMensual, tablaPorCategoria } from './tablero';
import { buscador, categoria, movimiento } from './pruebasDatos';

const categorias = [
  categoria('comida', 'egreso', 'esencial'),
  categoria('ocio', 'egreso', 'discrecional'),
  categoria('salario', 'ingreso', 'ordinario'),
  categoria('ahorro', 'egreso', 'ahorro'),
];
const porId = buscador(categorias);
const NOV = new Date(2026, 10, 1);

const enMes = (mes: number, dia: number) => new Date(2026, mes, dia, 12);

describe('tablaPorCategoria', () => {
  const movimientos = [
    // Agosto, septiembre y octubre: comida 100, 200 y 300 (promedio 200).
    movimiento(enMes(7, 5), 100, 'comida'),
    movimiento(enMes(8, 5), 200, 'comida'),
    movimiento(enMes(9, 5), 300, 'comida'),
    // Ocio solo en octubre: 90 en 3 meses = 30 de promedio.
    movimiento(enMes(9, 6), 90, 'ocio'),
    // Noviembre: comida 250, sin ocio.
    movimiento(enMes(10, 5), 250, 'comida'),
  ];

  it('el total es el del mes y el promedio el de los meses anteriores', () => {
    const tabla = tablaPorCategoria(movimientos, porId, NOV, 'egreso');
    const comida = tabla.filas.find((f) => f.id === 'comida');
    expect(comida?.total).toBe(250);
    expect(comida?.promedio).toBe(200);
    expect(comida?.variacion).toBe(25);
  });

  it('una categoría que no se movió este mes sale con total 0 y su promedio', () => {
    const tabla = tablaPorCategoria(movimientos, porId, NOV, 'egreso');
    const ocio = tabla.filas.find((f) => f.id === 'ocio');
    expect(ocio?.total).toBe(0);
    expect(ocio?.promedio).toBe(30);
    expect(ocio?.variacion).toBe(-100);
  });

  it('los totales de la tabla suman las filas', () => {
    const tabla = tablaPorCategoria(movimientos, porId, NOV, 'egreso');
    expect(tabla.total).toBe(250);
    expect(tabla.promedio).toBe(230);
    expect(Math.round(tabla.variacion ?? 0)).toBe(9);
  });

  it('ordena de mayor a menor total', () => {
    const tabla = tablaPorCategoria(movimientos, porId, NOV, 'egreso');
    expect(tabla.filas.map((f) => f.id)).toEqual(['comida', 'ocio']);
  });

  it('no mezcla ingresos con gastos ni cuenta el ahorro', () => {
    const con = [...movimientos, movimiento(enMes(10, 2), 1000, 'salario', 'ingreso'), movimiento(enMes(10, 20), 50, 'ahorro')];
    expect(tablaPorCategoria(con, porId, NOV, 'egreso').total).toBe(250);
    expect(tablaPorCategoria(con, porId, NOV, 'ingreso').total).toBe(1000);
  });

  it('el primer mes con datos no tiene con qué compararse', () => {
    const tabla = tablaPorCategoria([movimiento(enMes(10, 5), 250, 'comida')], porId, NOV, 'egreso');
    expect(tabla.filas[0].promedio).toBeNull();
    expect(tabla.filas[0].variacion).toBeNull();
    expect(tabla.promedio).toBeNull();
  });

  it('no diluye el promedio con meses anteriores al primer movimiento', () => {
    // Solo hay octubre antes de noviembre: promedio = 300, no 300/6.
    const tabla = tablaPorCategoria([movimiento(enMes(9, 5), 300, 'comida'), movimiento(enMes(10, 5), 300, 'comida')], porId, NOV, 'egreso');
    expect(tabla.filas[0].promedio).toBe(300);
    expect(tabla.filas[0].variacion).toBe(0);
  });

  it('las cuotas de créditos salen juntas como "Cuota de crédito"', () => {
    const cuota = (mes: number) => movimiento(enMes(mes, 5), 700, '', 'egreso', null, 'k1');
    const tabla = tablaPorCategoria([cuota(9), cuota(10)], porId, NOV, 'egreso');
    expect(tabla.filas[0]).toMatchObject({ id: 'credito', nombre: 'Cuota de crédito', total: 700, promedio: 700 });
  });
});

describe('serieMensual', () => {
  it('trae los meses hasta el elegido, del más viejo al más nuevo', () => {
    const serie = serieMensual(
      [movimiento(enMes(9, 5), 100, 'comida'), movimiento(enMes(10, 5), 300, 'salario', 'ingreso')],
      porId,
      NOV,
      3
    );
    expect(serie.map((p) => p.mes.getMonth())).toEqual([8, 9, 10]);
    expect(serie.map((p) => [p.ingresos, p.gastos])).toEqual([
      [0, 0],
      [0, 100],
      [300, 0],
    ]);
  });
});

describe('repartoDelMes', () => {
  it('divide lo que entró entre lo que quedó y lo que se gastó', () => {
    const r = repartoDelMes(1000, 400);
    expect(r.fraccionQuedo).toBeCloseTo(0.6);
    expect(r.fraccionGasto).toBeCloseTo(0.4);
    expect(r.quedo).toBe(600);
    expect(r.enRojo).toBe(false);
  });

  it('si se gastó más de lo que entró, todo es gasto y está en rojo', () => {
    const r = repartoDelMes(1000, 1500);
    expect(r.fraccionGasto).toBe(1);
    expect(r.fraccionQuedo).toBe(0);
    expect(r.quedo).toBe(-500);
    expect(r.enRojo).toBe(true);
  });

  it('sin ingresos no hay reparto', () => {
    expect(repartoDelMes(0, 0)).toMatchObject({ fraccionQuedo: 0, fraccionGasto: 0, enRojo: false });
  });
});

describe('mayoresGastos', () => {
  const delMes = [
    movimiento(enMes(10, 3), 50, 'comida'),
    movimiento(enMes(10, 4), 400, 'ocio'),
    movimiento(enMes(10, 5), 120, 'comida'),
    movimiento(enMes(10, 6), 9999, 'salario', 'ingreso'),
    movimiento(enMes(10, 7), 5000, 'ahorro'),
  ];

  it('ordena los gastos de mayor a menor y deja fuera ingresos y ahorro', () => {
    expect(mayoresGastos(delMes, porId).map((g) => g.monto)).toEqual([400, 120, 50]);
  });

  it('respeta el límite', () => {
    expect(mayoresGastos(delMes, porId, 2).map((g) => g.monto)).toEqual([400, 120]);
  });

  it('una cuota de crédito se presenta como "Cuota de crédito"', () => {
    const cuota = movimiento(enMes(10, 8), 700, '', 'egreso', null, 'k1');
    expect(mayoresGastos([cuota], porId)[0]).toMatchObject({ nombre: 'Cuota de crédito', emoji: '🏦' });
  });
});

describe('aniosConDatos', () => {
  it('lista los años con movimientos y el actual', () => {
    const t = [movimiento(new Date(2024, 3, 1), 1, 'comida'), movimiento(new Date(2026, 3, 1), 1, 'comida')];
    expect(aniosConDatos(t, new Date(2026, 10, 1))).toEqual([2024, 2026]);
    expect(aniosConDatos([], new Date(2026, 10, 1))).toEqual([2026]);
  });
});
