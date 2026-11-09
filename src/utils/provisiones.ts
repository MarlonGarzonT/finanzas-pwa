import type { GastoAnual, Transaccion } from '../types';

// Meses que quedan para juntar la plata, contando el actual: si vence este
// mes da 1; si venció el mes pasado, el próximo vencimiento está a 12.
export function mesesRestantes(mesVencimiento: number, hoy: Date = new Date()): number {
  const mesActual = hoy.getMonth() + 1;
  return ((mesVencimiento - mesActual + 12) % 12) + 1;
}

export function cuotaParaLlegar(gasto: GastoAnual, hoy: Date = new Date()): number {
  return gasto.montoEstimado / mesesRestantes(gasto.mesVencimiento, hoy);
}

// Lo que cuestan al mes, repartidos parejo en el año.
export function costoMensualEquivalente(lista: GastoAnual[]): number {
  return lista.filter((g) => g.activo).reduce((acc, g) => acc + g.montoEstimado / 12, 0);
}

// Hay un egreso de su categoría en el mes de vencimiento del año en curso.
// Es estado derivado: no se guarda.
export function pagadoEsteAnio(gasto: GastoAnual, transacciones: Transaccion[], hoy: Date = new Date()): boolean {
  if (!gasto.categoriaId) return false;
  const anio = hoy.getFullYear();
  const mesIndice = gasto.mesVencimiento - 1;
  return transacciones.some((t) => {
    if (t.tipo !== 'egreso' || t.categoriaId !== gasto.categoriaId) return false;
    const fecha = new Date(t.fecha);
    return fecha.getFullYear() === anio && fecha.getMonth() === mesIndice;
  });
}

// Plata a separar este mes para los gastos del año que vienen. Un pago solo
// saca al gasto de la cuenta si su vencimiento es este mes o uno que aún no
// pasa: si ya pasó (la matrícula de enero, vista en noviembre), lo que viene
// es el del año siguiente y hay que seguir provisionándolo.
export function provisionDelMes(lista: GastoAnual[], transacciones: Transaccion[], hoy: Date = new Date()): number {
  const mesActual = hoy.getMonth() + 1;
  return lista
    .filter((g) => g.activo)
    .filter((g) => !(g.mesVencimiento >= mesActual && pagadoEsteAnio(g, transacciones, hoy)))
    .reduce((acc, g) => acc + cuotaParaLlegar(g, hoy), 0);
}

// Un egreso es el pago de un gasto del año si es de su categoría y cae en su
// mes de vencimiento. Esos pagos no deben mover la comparación entre meses.
export function esPagoDeGastoAnual(t: Transaccion, gastosAnuales: GastoAnual[]): boolean {
  if (t.tipo !== 'egreso') return false;
  const mes = new Date(t.fecha).getMonth() + 1;
  return gastosAnuales.some((g) => g.activo && g.categoriaId === t.categoriaId && g.mesVencimiento === mes);
}
