import { describe, expect, it } from 'vitest';
import { conMovimientos } from './ordenMovimientos';
import { movimiento } from './pruebasDatos';

describe('conMovimientos', () => {
  const dia8 = movimiento(new Date(2026, 10, 8, 10), 10_000, 'c');
  const dia5 = movimiento(new Date(2026, 10, 5, 10), 10_000, 'c');

  it('un movimiento nuevo con fecha anterior queda en su lugar, no arriba', () => {
    const dia3 = movimiento(new Date(2026, 10, 3, 10), 10_000, 'c');
    expect(conMovimientos([dia8, dia5], [dia3]).map((t) => t.id)).toEqual([dia8.id, dia5.id, dia3.id]);
  });

  it('editar la fecha mueve el movimiento a su lugar', () => {
    const movido = { ...dia5, fecha: new Date(2026, 10, 9, 10).toISOString() };
    expect(conMovimientos([dia8, dia5], [movido]).map((t) => t.id)).toEqual([dia5.id, dia8.id]);
  });

  it('compara instantes aunque el texto ISO tenga distinta precisión', () => {
    const a = { ...dia8, id: 'a', fecha: '2026-11-08T15:00:00+00:00' };
    const b = { ...dia8, id: 'b', fecha: '2026-11-08T15:00:00.5+00:00' };
    expect(conMovimientos([a], [b]).map((t) => t.id)).toEqual(['b', 'a']);
  });
});
