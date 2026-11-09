import type { Categoria, Naturaleza, Transaccion } from '../types';
import { naturalezaValidaParaTipo } from './naturalezaCategoria';

export type Clase =
  | 'gasto_esencial'
  | 'gasto_discrecional'
  | 'gasto_deuda'
  | 'ahorro'
  | 'pago_tarjeta'
  | 'ingreso_ordinario'
  | 'ingreso_extraordinario'
  | 'prestamo_reembolso'
  // Préstamos que tú haces (sección Préstamos): la salida y los abonos.
  | 'prestamo_dado'
  | 'prestamo_cobrado';

const CLASE_POR_NATURALEZA: Record<Naturaleza, Clase> = {
  esencial: 'gasto_esencial',
  discrecional: 'gasto_discrecional',
  deuda: 'gasto_deuda',
  ahorro: 'ahorro',
  pago_tarjeta: 'pago_tarjeta',
  ordinario: 'ingreso_ordinario',
  extraordinario: 'ingreso_extraordinario',
  prestamo_reembolso: 'prestamo_reembolso',
};

// Sin categoría (la borraron) o con una cuyo tipo ya no coincide con el del
// movimiento (le cambiaron el tipo después), se cuenta según el tipo del
// movimiento: un egreso como gasto necesario, un ingreso como habitual.
export function naturalezaEfectiva(t: Transaccion, categoria?: Categoria): Naturaleza {
  if (categoria && naturalezaValidaParaTipo(categoria.naturaleza, t.tipo)) return categoria.naturaleza;
  return t.tipo === 'ingreso' ? 'ordinario' : 'esencial';
}

// Un movimiento de un préstamo se reconoce por su prestamoId, no por la
// categoría: no es gasto ni ingreso, pero sí mueve el Disponible.
export function clasificar(t: Transaccion, categoria?: Categoria): Clase {
  if (t.prestamoId) return t.tipo === 'egreso' ? 'prestamo_dado' : 'prestamo_cobrado';
  return CLASE_POR_NATURALEZA[naturalezaEfectiva(t, categoria)];
}

export function esGasto(clase: Clase): boolean {
  return clase === 'gasto_esencial' || clase === 'gasto_discrecional' || clase === 'gasto_deuda';
}

export function esIngreso(clase: Clase): boolean {
  return clase === 'ingreso_ordinario' || clase === 'ingreso_extraordinario';
}

export interface ResumenContable {
  ingresosOrdinarios: number;
  ingresosExtraordinarios: number;
  ingresos: number;
  gastosEsenciales: number;
  gastosDiscrecionales: number;
  cuotasDeuda: number;
  gastos: number;
  ahorro: number;
  pagosTarjeta: number;
  prestamosReembolsos: number;
  // Plata que prestaste y abonos que te hicieron a esos préstamos.
  prestamosDados: number;
  prestamosCobrados: number;
  // Ingresos − gastos − ahorro − lo prestado + lo que te devolvieron. El pago
  // de tarjeta no resta (sus compras ya se contaron como gasto) y un
  // préstamo que te hacen a ti no suma.
  disponible: number;
}

export function resumirMes(
  transacciones: Transaccion[],
  categoriaPorId: (id: string) => Categoria | undefined
): ResumenContable {
  const totales: Record<Clase, number> = {
    gasto_esencial: 0,
    gasto_discrecional: 0,
    gasto_deuda: 0,
    ahorro: 0,
    pago_tarjeta: 0,
    ingreso_ordinario: 0,
    ingreso_extraordinario: 0,
    prestamo_reembolso: 0,
    prestamo_dado: 0,
    prestamo_cobrado: 0,
  };
  for (const t of transacciones) {
    totales[clasificar(t, categoriaPorId(t.categoriaId))] += t.monto;
  }
  const ingresos = totales.ingreso_ordinario + totales.ingreso_extraordinario;
  const gastos = totales.gasto_esencial + totales.gasto_discrecional + totales.gasto_deuda;
  return {
    ingresosOrdinarios: totales.ingreso_ordinario,
    ingresosExtraordinarios: totales.ingreso_extraordinario,
    ingresos,
    gastosEsenciales: totales.gasto_esencial,
    gastosDiscrecionales: totales.gasto_discrecional,
    cuotasDeuda: totales.gasto_deuda,
    gastos,
    ahorro: totales.ahorro,
    pagosTarjeta: totales.pago_tarjeta,
    prestamosReembolsos: totales.prestamo_reembolso,
    prestamosDados: totales.prestamo_dado,
    prestamosCobrados: totales.prestamo_cobrado,
    disponible: ingresos - gastos - totales.ahorro - totales.prestamo_dado + totales.prestamo_cobrado,
  };
}
