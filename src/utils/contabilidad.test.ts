import { describe, expect, it } from 'vitest';
import { clasificar, resumirMes } from './contabilidad';
import { claveMes } from './fechas';
import { buscador, categoria, movimiento } from './pruebasDatos';

const salario = categoria('salario', 'ingreso', 'ordinario');
const prima = categoria('prima', 'ingreso', 'extraordinario');
const prestamo = categoria('prestamo', 'ingreso', 'prestamo_reembolso');
const mercado = categoria('mercado', 'egreso', 'esencial');
const ahorro = categoria('ahorro', 'egreso', 'ahorro');
const tarjeta = categoria('tarjeta', 'egreso', 'pago_tarjeta');
const porId = buscador([salario, prima, prestamo, mercado, ahorro, tarjeta]);

describe('resumirMes (B2)', () => {
  it('salario 2.500.000, ahorro 500.000 y gastos 1.600.000 dejan 400.000 disponibles', () => {
    const resumen = resumirMes(
      [
        movimiento(new Date(2026, 10, 1), 2_500_000, 'salario', 'ingreso'),
        movimiento(new Date(2026, 10, 2), 500_000, 'ahorro'),
        movimiento(new Date(2026, 10, 3), 1_600_000, 'mercado'),
      ],
      porId
    );
    expect(resumen.ingresos).toBe(2_500_000);
    expect(resumen.gastos).toBe(1_600_000);
    expect(resumen.ahorro).toBe(500_000);
    expect(resumen.disponible).toBe(400_000);
  });

  it('un préstamo recibido no cambia los ingresos', () => {
    const resumen = resumirMes(
      [
        movimiento(new Date(2026, 10, 1), 2_500_000, 'salario', 'ingreso'),
        movimiento(new Date(2026, 10, 5), 3_000_000, 'prestamo', 'ingreso'),
      ],
      porId
    );
    expect(resumen.ingresos).toBe(2_500_000);
    expect(resumen.prestamosReembolsos).toBe(3_000_000);
  });

  it('el pago de la tarjeta no cuenta otra vez lo que ya se gastó', () => {
    const transacciones = [
      movimiento(new Date(2026, 9, 10), 800_000, 'mercado'),
      movimiento(new Date(2026, 10, 5), 800_000, 'tarjeta'),
    ];
    const noviembre = transacciones.filter((t) => claveMes(t.fecha) === '2026-11');
    const resumen = resumirMes(noviembre, porId);
    expect(resumen.gastos).toBe(0);
    expect(resumen.pagosTarjeta).toBe(800_000);
    expect(resumen.disponible).toBe(0);
  });

  it('la prima suma al ingreso y se reporta aparte', () => {
    const resumen = resumirMes(
      [
        movimiento(new Date(2026, 11, 1), 2_500_000, 'salario', 'ingreso'),
        movimiento(new Date(2026, 11, 15), 1_250_000, 'prima', 'ingreso'),
      ],
      porId
    );
    expect(resumen.ingresos).toBe(3_750_000);
    expect(resumen.ingresosExtraordinarios).toBe(1_250_000);
  });
});

describe('clasificar', () => {
  it('sin categoría cuenta según el tipo del movimiento', () => {
    expect(clasificar(movimiento(new Date(), 1, 'x'), undefined)).toBe('gasto_esencial');
    expect(clasificar(movimiento(new Date(), 1, 'x', 'ingreso'), undefined)).toBe('ingreso_ordinario');
  });

  it('si la categoría cambió de tipo después, cuenta según el movimiento', () => {
    // Movimiento de egreso en una categoría que hoy es de ingreso.
    expect(clasificar(movimiento(new Date(), 1, 'salario'), salario)).toBe('gasto_esencial');
  });
});
