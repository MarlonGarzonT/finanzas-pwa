import type { Naturaleza, NaturalezaEgreso, NaturalezaIngreso, Tipo } from '../types';

const NATURALEZAS_EGRESO: NaturalezaEgreso[] = ['esencial', 'discrecional', 'deuda', 'ahorro', 'pago_tarjeta'];
const NATURALEZAS_INGRESO: NaturalezaIngreso[] = ['ordinario', 'extraordinario', 'prestamo_reembolso'];

interface Descripcion {
  etiqueta: string;
  ejemplos: string;
}

const DESCRIPCIONES: Record<Naturaleza, Descripcion> = {
  esencial: { etiqueta: 'Necesario', ejemplos: 'Vivienda, servicios, mercado, transporte, salud' },
  discrecional: { etiqueta: 'Prescindible', ejemplos: 'Salidas, domicilios, ropa, suscripciones' },
  deuda: { etiqueta: 'Cuota de un crédito', ejemplos: 'Moto, libranza, crédito de vivienda' },
  ahorro: { etiqueta: 'Ahorro', ejemplos: 'Bolsillo, CDT, pensión voluntaria. No cuenta como gasto' },
  pago_tarjeta: {
    etiqueta: 'Pago de tarjeta',
    ejemplos: 'Las compras ya se registraron como gasto, así que el pago no suma',
  },
  ordinario: { etiqueta: 'Ingreso habitual', ejemplos: 'Salario, honorarios, ventas' },
  extraordinario: { etiqueta: 'Ingreso extra', ejemplos: 'Prima, bonos, intereses de cesantías' },
  prestamo_reembolso: {
    etiqueta: 'Préstamo o devolución',
    ejemplos: 'Entra plata que no es ingreso: un préstamo, alguien te devuelve',
  },
};

export function naturalezasPorTipo(tipo: Tipo): Naturaleza[] {
  return tipo === 'ingreso' ? NATURALEZAS_INGRESO : NATURALEZAS_EGRESO;
}

export function etiquetaNaturaleza(naturaleza: Naturaleza): string {
  return DESCRIPCIONES[naturaleza].etiqueta;
}

export function ejemplosNaturaleza(naturaleza: Naturaleza): string {
  return DESCRIPCIONES[naturaleza].ejemplos;
}

export function naturalezaValidaParaTipo(naturaleza: Naturaleza, tipo: Tipo): boolean {
  return naturalezasPorTipo(tipo).includes(naturaleza);
}

// "Gasto fijo mensual" solo tiene sentido en lo que es gasto: el ahorro y el
// pago de tarjeta no suman como gasto, así que marcarlos fijos no dice nada.
export function naturalezaAdmiteFijo(naturaleza: Naturaleza): boolean {
  return naturaleza === 'esencial' || naturaleza === 'discrecional' || naturaleza === 'deuda';
}

// Mismas reglas que la migración de supabase/schema.sql: si se cambian aquí,
// hay que cambiarlas allá. Ante la duda, esencial: es más prudente
// sobrestimar el gasto necesario que subestimarlo.
export function sugerirNaturaleza(nombre: string, tipo: Tipo): Naturaleza {
  if (tipo === 'ingreso') {
    if (/prima|bono|bonifica|cesant/i.test(nombre)) return 'extraordinario';
    if (/pr[eé]stamo|reembolso|devoluci/i.test(nombre)) return 'prestamo_reembolso';
    return 'ordinario';
  }
  if (/ahorro/i.test(nombre)) return 'ahorro';
  if (/tarjeta/i.test(nombre)) return 'pago_tarjeta';
  if (/cuota|cr[eé]dito|deuda/i.test(nombre)) return 'deuda';
  if (/entreten|salida|domicilio/i.test(nombre)) return 'discrecional';
  return 'esencial';
}
