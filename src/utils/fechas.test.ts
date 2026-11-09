import { describe, expect, it } from 'vitest';
import { fechaEnMesSeleccionado, fechaLocalISO } from './fechas';

describe('fechaEnMesSeleccionado (fecha inicial del formulario)', () => {
  const treintaYUnoOct = new Date(2026, 9, 31, 22, 36);

  it('en el mes actual es hoy', () => {
    expect(fechaLocalISO(fechaEnMesSeleccionado(new Date(2026, 9, 1), treintaYUnoOct))).toBe('2026-10-31');
  });

  it('en un mes futuro arranca el día 1, no un día inventado al final (caso Cover)', () => {
    expect(fechaLocalISO(fechaEnMesSeleccionado(new Date(2026, 10, 1), treintaYUnoOct))).toBe('2026-11-01');
  });

  it('en un mes pasado usa el mismo día, ajustado si el mes es más corto', () => {
    expect(fechaLocalISO(fechaEnMesSeleccionado(new Date(2026, 8, 1), treintaYUnoOct))).toBe('2026-09-30');
  });
});
