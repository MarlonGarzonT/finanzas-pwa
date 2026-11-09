import { describe, expect, it } from 'vitest';
import { sugerirNaturaleza } from './naturalezaCategoria';

describe('sugerirNaturaleza (B1, mismas reglas que la migración SQL)', () => {
  it.each([
    ['Salario', 'ingreso', 'ordinario'],
    ['Prima y extras', 'ingreso', 'extraordinario'],
    ['Intereses cesantías', 'ingreso', 'extraordinario'],
    ['Préstamo o devolución', 'ingreso', 'prestamo_reembolso'],
    ['Ahorro', 'egreso', 'ahorro'],
    ['Pago tarjeta', 'egreso', 'pago_tarjeta'],
    ['Cuota moto', 'egreso', 'deuda'],
    ['Crédito vivienda', 'egreso', 'deuda'],
    ['Entretenimiento', 'egreso', 'discrecional'],
    ['Domicilios', 'egreso', 'discrecional'],
    ['Mercado', 'egreso', 'esencial'],
  ] as const)('%s (%s) → %s', (nombre, tipo, esperada) => {
    expect(sugerirNaturaleza(nombre, tipo)).toBe(esperada);
  });
});
