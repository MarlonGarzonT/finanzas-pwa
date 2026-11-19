import { describe, expect, it } from 'vitest';
import type { Prestamo } from '../types';
import { resumirMes } from './contabilidad';
import { fechaConHora, fechaDesdeISO, fechaLocalISO } from './fechas';
import { describirVencimiento, estadosPrestamos, fechaDePlazo, iniciales, personasFrecuentes, resumirPrestamos } from './prestamos';
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

  it('el día elegido conserva la hora del registro (31-oct, no 9-oct)', () => {
    const registro = new Date(2026, 10, 9, 15, 37, 5);
    const fecha = fechaConHora('2026-10-31', registro);
    expect(fechaLocalISO(fecha)).toBe('2026-10-31');
    expect([fecha.getHours(), fecha.getMinutes(), fecha.getSeconds()]).toEqual([15, 37, 5]);
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
    expect(resumirPrestamos(estados)).toEqual({ pendiente: 300_000, pendientes: 2, vencidos: 1, prestadoPendientes: 300_000, devueltoPendientes: 0 });
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

describe('describirVencimiento', () => {
  const salida = (id: string) => movimiento(new Date(2026, 9, 20), 100_000, '', 'egreso', id);
  const prestamoCon = (fechaDevolucion: string): Prestamo => ({ id: 'p9', persona: 'Luis', monto: 100_000, fechaDevolucion, nota: null });
  const texto = (fechaDevolucion: string) => {
    const [estado] = estadosPrestamos([prestamoCon(fechaDevolucion)], [salida('p9')], NUEVE_NOV);
    return describirVencimiento(estado, NUEVE_NOV);
  };

  it('dice hoy, mañana y en N días con tono "pronto"', () => {
    expect(texto('2026-11-09')).toEqual({ texto: 'Te paga hoy', tono: 'pronto' });
    expect(texto('2026-11-10')).toEqual({ texto: 'Te paga mañana', tono: 'pronto' });
    expect(texto('2026-11-14')).toEqual({ texto: 'Te paga en 5 días', tono: 'pronto' });
  });

  it('a más de una semana da la fecha con tono tranquilo', () => {
    expect(texto('2026-11-30')).toEqual({ texto: 'Te paga el 30 de nov', tono: 'tranquilo' });
  });

  it('pasada la fecha cuenta los días de atraso', () => {
    expect(texto('2026-11-08')).toEqual({ texto: 'Venció ayer', tono: 'vencido' });
    expect(texto('2026-11-05')).toEqual({ texto: 'Venció hace 4 días', tono: 'vencido' });
  });
});

describe('plazos y nombres', () => {
  it('fechaDePlazo suma días y meses calendario', () => {
    expect(fechaDePlazo('semana', NUEVE_NOV)).toBe('2026-11-16');
    expect(fechaDePlazo('quincena', NUEVE_NOV)).toBe('2026-11-24');
    expect(fechaDePlazo('mes', NUEVE_NOV)).toBe('2026-12-09');
  });

  it('1 mes desde el 31-ene cae el último día de febrero, no en marzo', () => {
    expect(fechaDePlazo('mes', new Date(2026, 0, 31))).toBe('2026-02-28');
  });

  it('iniciales toma hasta dos palabras', () => {
    expect(iniciales('juan pérez gómez')).toBe('JP');
    expect(iniciales('  ana ')).toBe('A');
    expect(iniciales('')).toBe('?');
  });

  it('personasFrecuentes pone primero a quien más se le ha prestado, sin repetir', () => {
    const nombres = personasFrecuentes([
      { ...aJuan, id: 'a', persona: 'Juan' },
      { ...aAna, id: 'b', persona: 'Ana' },
      { ...aAna, id: 'c', persona: 'ana' },
    ]);
    expect(nombres).toEqual(['Ana', 'Juan']);
  });
});
