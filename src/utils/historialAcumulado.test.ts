import { describe, expect, it } from 'vitest';
import { historialAcumulado } from './historialAcumulado';
import { buscador, categoria, movimiento } from './pruebasDatos';

const salario = categoria('salario', 'ingreso', 'ordinario');
const mercado = categoria('mercado', 'egreso', 'esencial');
const ahorro = categoria('ahorro', 'egreso', 'ahorro');
const porId = buscador([salario, mercado, ahorro]);
const HOY = new Date(2026, 10, 12, 10);

describe('historialAcumulado', () => {
  it('acumula mes a mes y deja planos los meses sin movimientos', () => {
    const h = historialAcumulado(
      [
        movimiento(new Date(2026, 7, 5, 9), 3_000_000, 'salario', 'ingreso'),
        movimiento(new Date(2026, 7, 9, 9), 1_000_000, 'mercado'),
        // Septiembre sin movimientos.
        movimiento(new Date(2026, 9, 5, 9), 3_000_000, 'salario', 'ingreso'),
        movimiento(new Date(2026, 10, 2, 9), 500_000, 'mercado'),
      ],
      porId,
      HOY
    );
    expect(h.puntos.map((p) => [p.mes.getMonth(), p.ingresos, p.gastos])).toEqual([
      [7, 3_000_000, 1_000_000],
      [8, 3_000_000, 1_000_000],
      [9, 6_000_000, 1_000_000],
      [10, 6_000_000, 1_500_000],
    ]);
    expect(h.brecha).toBe(4_500_000);
    expect(h.tasa).toBe(0.75);
  });

  it('no cuenta ahorro apartado ni préstamos como gasto o ingreso', () => {
    const h = historialAcumulado(
      [
        movimiento(new Date(2026, 10, 1, 9), 2_000_000, 'salario', 'ingreso'),
        movimiento(new Date(2026, 10, 2, 9), 400_000, 'ahorro'),
        movimiento(new Date(2026, 10, 3, 9), 300_000, '', 'egreso', 'p1'),
        movimiento(new Date(2026, 10, 4, 9), 100_000, '', 'ingreso', 'p1'),
      ],
      porId,
      HOY
    );
    expect(h.ingresos).toBe(2_000_000);
    expect(h.gastos).toBe(0);
    expect(h.puntos).toHaveLength(1);
  });

  it('un gasto del último día a las 9 p. m. queda en su mes local', () => {
    const h = historialAcumulado([movimiento(new Date(2026, 9, 31, 21), 50_000, 'mercado')], porId, HOY);
    expect(h.puntos[0].mes.getMonth()).toBe(9);
    expect(h.puntos[0].gastos).toBe(50_000);
  });

  it('sin movimientos que cuenten no hay puntos ni tasa', () => {
    const h = historialAcumulado([], porId, HOY);
    expect(h.puntos).toEqual([]);
    expect(h.tasa).toBeNull();
  });
});
