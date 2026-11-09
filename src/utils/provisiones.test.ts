import { describe, expect, it } from 'vitest';
import { costoMensualEquivalente, cuotaParaLlegar, mesesRestantes, pagadoEsteAnio, provisionDelMes } from './provisiones';
import { gastoAnual, movimiento } from './pruebasDatos';

const NUEVE_NOV = new Date(2026, 10, 9);

describe('gastos del año (A4)', () => {
  const soat = gastoAnual('SOAT', 600_000, 3);
  const predial = gastoAnual('Predial', 900_000, 4);
  const matricula = gastoAnual('Matrícula', 1_800_000, 1, 'educacion');
  const diciembre = gastoAnual('Diciembre', 1_500_000, 12);

  it('el costo mensual equivalente de los cuatro es 400.000', () => {
    expect(costoMensualEquivalente([soat, predial, matricula, diciembre])).toBe(400_000);
  });

  it('los inactivos no cuentan', () => {
    expect(costoMensualEquivalente([soat, { ...diciembre, activo: false }])).toBe(50_000);
  });

  it('el 9-nov, la cuota para llegar al SOAT de marzo es 120.000', () => {
    expect(mesesRestantes(3, NUEVE_NOV)).toBe(5);
    expect(cuotaParaLlegar(soat, NUEVE_NOV)).toBe(120_000);
  });

  it('si vence este mes queda un solo mes', () => {
    expect(mesesRestantes(11, NUEVE_NOV)).toBe(1);
    expect(mesesRestantes(10, NUEVE_NOV)).toBe(12);
  });

  it('detecta el pago en el mes de vencimiento del año en curso', () => {
    const pagoEnero = movimiento(new Date(2026, 0, 12), 1_800_000, 'educacion');
    expect(pagadoEsteAnio(matricula, [pagoEnero], NUEVE_NOV)).toBe(true);
    expect(pagadoEsteAnio(matricula, [], NUEVE_NOV)).toBe(false);
  });

  it('un vencimiento que ya pasó se sigue provisionando para el año siguiente', () => {
    const pagoEnero = movimiento(new Date(2026, 0, 12), 1_800_000, 'educacion');
    // Matrícula de enero 2027: faltan 3 meses (nov, dic, ene).
    expect(provisionDelMes([matricula], [pagoEnero], NUEVE_NOV)).toBe(600_000);
  });

  it('un gasto pagado en su mes de vencimiento deja de provisionarse ese mes', () => {
    const enEnero = new Date(2027, 0, 20);
    const pago = movimiento(new Date(2027, 0, 12), 1_800_000, 'educacion');
    expect(provisionDelMes([matricula], [pago], enEnero)).toBe(0);
    expect(provisionDelMes([matricula], [], enEnero)).toBe(1_800_000);
  });
});
