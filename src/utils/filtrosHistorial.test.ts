import { describe, expect, it } from 'vitest';
import { agruparPorMes } from './filtrosHistorial';
import { movimiento } from './pruebasDatos';

// Desordenados a propósito: el Historial no debe depender del orden de llegada.
const sep20 = movimiento(new Date(2026, 8, 20, 9), 30_000, 'c');
const nov2 = movimiento(new Date(2026, 10, 2, 9), 500_000, 'c');
const oct31Noche = movimiento(new Date(2026, 9, 31, 21), 80_000, 'c');
const nov9 = movimiento(new Date(2026, 10, 9, 18, 30), 12_000, 'c');
const oct5 = movimiento(new Date(2026, 9, 5, 12), 200_000, 'c');
const nov9Antes = movimiento(new Date(2026, 10, 9, 8), 45_000, 'c');
const desordenados = [sep20, nov2, oct31Noche, nov9, oct5, nov9Antes];

describe('agruparPorMes (Historial)', () => {
  it('los meses van del más reciente al más viejo', () => {
    expect(agruparPorMes(desordenados, 'fecha').map((g) => g.clave)).toEqual(['2026-11', '2026-10', '2026-09']);
  });

  it('el primer movimiento es el más reciente de todos', () => {
    const [noviembre] = agruparPorMes(desordenados, 'fecha');
    expect(noviembre.movimientos[0].id).toBe(nov9.id);
  });

  it('dentro de cada mes van por fecha y hora, de nuevo a viejo', () => {
    const grupos = agruparPorMes(desordenados, 'fecha');
    expect(grupos[0].movimientos.map((t) => t.id)).toEqual([nov9.id, nov9Antes.id, nov2.id]);
    expect(grupos[1].movimientos.map((t) => t.id)).toEqual([oct31Noche.id, oct5.id]);
  });

  it('un movimiento del 31-oct a las 9 p. m. queda en octubre (hora local, no UTC)', () => {
    const octubre = agruparPorMes(desordenados, 'fecha').find((g) => g.clave === '2026-10');
    expect(octubre?.movimientos.map((t) => t.id)).toContain(oct31Noche.id);
    expect(octubre?.titulo).toBe('Octubre de 2026');
  });

  it('ordenar por monto cambia el orden dentro del mes, no el de los meses', () => {
    const grupos = agruparPorMes(desordenados, 'monto');
    expect(grupos.map((g) => g.clave)).toEqual(['2026-11', '2026-10', '2026-09']);
    expect(grupos[0].movimientos.map((t) => t.monto)).toEqual([500_000, 45_000, 12_000]);
  });
});
