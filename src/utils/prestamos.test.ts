import { describe, expect, it } from 'vitest';
import type { Prestamo } from '../types';
import { resumirMes } from './contabilidad';
import { estadosPrestamos, fechaDesdeISO, fechaLocalISO, resumirPrestamos } from './prestamos';
import { buscador, categoria, movimiento } from './pruebasDatos';

const NUEVE_NOV = new Date(2026, 10, 9, 21);
const aJuan: Prestamo = { id: 'p1', persona: 'Juan', monto: 200_000, fechaDevolucion: '2026-11-05', nota: null };
const aAna: Prestamo = { id: 'p2', persona: 'Ana', monto: 100_000, fechaDevolucion: '2026-11-30', nota: null };

describe('fechas locales', () => {
  it('a las 9 p. m. del 9-nov en Colombia sigue siendo el 9', () => {
    expect(fechaLocalISO(NUEVE_NOV)).toBe('2026-11-09');
  });

  it("'2026-11-05' es el 5 a medianoche local, no el 4", () => {
    expect(fechaDesdeISO('2026-11-05').getDate()).toBe(5);
  });
});

describe('estadosPrestamos', () => {
  const salidaJuan = movimiento(new Date(2026, 9, 20), 200_000, '', 'egreso', 'p1');
  const salidaAna = movimiento(new Date(2026, 10, 2), 100_000, '', 'egreso', 'p2');

  it('sin abonos debe todo y, pasada la fecha, está vencido', () => {
    const [juan] = estadosPrestamos([aJuan], [salidaJuan], NUEVE_NOV);
    expect(juan.saldo).toBe(200_000);
    expect(juan.vencido).toBe(true);
    expect(juan.diasVencido).toBe(4);
    expect(juan.fechaPrestamo).toBe(salidaJuan.fecha);
  });

  it('los abonos bajan el saldo y al llegar a cero queda pagado', () => {
    const abono1 = movimiento(new Date(2026, 10, 3), 50_000, '', 'ingreso', 'p1');
    const parcial = estadosPrestamos([aJuan], [salidaJuan, abono1], NUEVE_NOV)[0];
    expect(parcial.abonado).toBe(50_000);
    expect(parcial.saldo).toBe(150_000);
    expect(parcial.pagado).toBe(false);

    const abono2 = movimiento(new Date(2026, 10, 8), 150_000, '', 'ingreso', 'p1');
    const pagado = estadosPrestamos([aJuan], [salidaJuan, abono1, abono2], NUEVE_NOV)[0];
    expect(pagado.pagado).toBe(true);
    expect(pagado.vencido).toBe(false);
    expect(pagado.fechaPago).toBe(abono2.fecha);
  });

  it('el día en que vence todavía no está vencido', () => {
    const [ana] = estadosPrestamos([{ ...aAna, fechaDevolucion: '2026-11-09' }], [salidaAna], NUEVE_NOV);
    expect(ana.vencido).toBe(false);
  });

  it('resume lo que te deben', () => {
    const estados = estadosPrestamos([aJuan, aAna], [salidaJuan, salidaAna], NUEVE_NOV);
    expect(resumirPrestamos(estados)).toEqual({ pendiente: 300_000, pendientes: 2, vencidos: 1 });
  });
});

describe('préstamos en el Disponible', () => {
  const salario = categoria('salario', 'ingreso', 'ordinario');
  const porId = buscador([salario]);

  it('prestar resta del Disponible sin contar como gasto, y el abono lo devuelve', () => {
    const salida = movimiento(new Date(2026, 10, 2), 200_000, '', 'egreso', 'p1');
    const sueldo = movimiento(new Date(2026, 10, 1), 2_500_000, 'salario', 'ingreso');
    const alPrestar = resumirMes([sueldo, salida], porId);
    expect(alPrestar.gastos).toBe(0);
    expect(alPrestar.prestamosDados).toBe(200_000);
    expect(alPrestar.disponible).toBe(2_300_000);

    const abono = movimiento(new Date(2026, 10, 8), 200_000, '', 'ingreso', 'p1');
    const alCobrar = resumirMes([sueldo, salida, abono], porId);
    expect(alCobrar.ingresos).toBe(2_500_000);
    expect(alCobrar.disponible).toBe(2_500_000);
  });
});
