import type { Categoria, Transaccion } from '../types';
import { clasificar, esGasto, resumirMes } from './contabilidad';
import { desglosePorCategoria } from './estadisticasMes';
import { claveMes, claveMesDeFecha, sumarMeses } from './fechas';
import { presentacionMovimiento } from './presentacionMovimiento';

// Cuántos meses anteriores entran en el "promedio" de cada categoría.
export const MESES_DEL_PROMEDIO = 6;

export interface FilaCategoria {
  // 'credito' agrupa las cuotas de créditos, que no tienen categoría.
  id: string;
  nombre: string;
  emoji: string;
  total: number;
  // Lo que esa categoría suele sumar en un mes (los meses anteriores del
  // periodo de comparación); null si todavía no hay meses anteriores.
  promedio: number | null;
  // (total − promedio) / promedio, en %; null si no hay con qué comparar.
  variacion: number | null;
}

export interface TablaCategorias {
  filas: FilaCategoria[];
  total: number;
  promedio: number | null;
  variacion: number | null;
}

function variacionEntre(total: number, promedio: number | null): number | null {
  if (promedio === null || promedio <= 0) return null;
  return ((total - promedio) / promedio) * 100;
}

function agruparPorMes(transacciones: Transaccion[]): Map<string, Transaccion[]> {
  const porMes = new Map<string, Transaccion[]>();
  for (const t of transacciones) {
    const clave = claveMes(t.fecha);
    const lista = porMes.get(clave);
    if (lista) lista.push(t);
    else porMes.set(clave, [t]);
  }
  return porMes;
}

// Los meses anteriores al elegido contra los que se compara, de hasta
// MESES_DEL_PROMEDIO, sin ir más atrás del primer movimiento (antes de eso no
// había nada que promediar y diluiría el promedio con ceros).
function mesesAnteriores(mes: Date, claves: Iterable<string>): string[] {
  let primero: string | null = null;
  for (const clave of claves) if (primero === null || clave < primero) primero = clave;
  if (primero === null) return [];
  const resultado: string[] = [];
  for (let i = 1; i <= MESES_DEL_PROMEDIO; i++) {
    const clave = claveMesDeFecha(sumarMeses(mes, -i));
    if (clave >= primero) resultado.push(clave);
  }
  return resultado;
}

// Ingresos o gastos del mes por categoría, cada uno junto a su promedio de los
// meses anteriores y cuánto se aparta de él. Es la tabla central del tablero.
// Usa la misma clasificación del resto de la app (el ahorro, los préstamos y
// el pago de tarjeta no son gasto ni ingreso; las cuotas de créditos sí son
// gasto y salen juntas como "Cuota de crédito").
export function tablaPorCategoria(
  transacciones: Transaccion[],
  categoriaPorId: (id: string) => Categoria | undefined,
  mes: Date,
  tipo: 'ingreso' | 'egreso'
): TablaCategorias {
  const porMes = agruparPorMes(transacciones);
  const actual = desglosePorCategoria(porMes.get(claveMesDeFecha(mes)) ?? [], categoriaPorId, tipo);
  const anteriores = mesesAnteriores(mes, porMes.keys());

  const sumaPrevia = new Map<string, number>();
  const muestra = new Map<string, { nombre: string; emoji: string }>();
  for (const clave of anteriores) {
    for (const s of desglosePorCategoria(porMes.get(clave) ?? [], categoriaPorId, tipo)) {
      sumaPrevia.set(s.categoriaId, (sumaPrevia.get(s.categoriaId) ?? 0) + s.monto);
      muestra.set(s.categoriaId, { nombre: s.nombre, emoji: s.emoji });
    }
  }

  const ids = new Set<string>([...actual.map((s) => s.categoriaId), ...sumaPrevia.keys()]);
  const filas: FilaCategoria[] = [];
  for (const id of ids) {
    const delMes = actual.find((s) => s.categoriaId === id);
    const base = delMes ?? muestra.get(id);
    if (!base) continue;
    const total = delMes?.monto ?? 0;
    const promedio = anteriores.length > 0 ? (sumaPrevia.get(id) ?? 0) / anteriores.length : null;
    filas.push({ id, nombre: base.nombre, emoji: base.emoji, total, promedio, variacion: variacionEntre(total, promedio) });
  }
  filas.sort((a, b) => b.total - a.total || (b.promedio ?? 0) - (a.promedio ?? 0));

  const total = filas.reduce((acc, f) => acc + f.total, 0);
  const promedio = anteriores.length > 0 ? filas.reduce((acc, f) => acc + (f.promedio ?? 0), 0) : null;
  return { filas, total, promedio, variacion: variacionEntre(total, promedio) };
}

export interface GastoGrande {
  id: string;
  item: string;
  fecha: string;
  monto: number;
  nombre: string;
  emoji: string;
}

// Los gastos individuales más grandes del mes (los préstamos, el ahorro y el
// pago de tarjeta no son gasto y no entran), del mayor al menor.
export function mayoresGastos(
  transaccionesDelMes: Transaccion[],
  categoriaPorId: (id: string) => Categoria | undefined,
  limite = 5
): GastoGrande[] {
  return transaccionesDelMes
    .filter((t) => esGasto(clasificar(t, categoriaPorId(t.categoriaId))))
    .sort((a, b) => b.monto - a.monto)
    .slice(0, limite)
    .map((t) => {
      const { nombre, emoji } = presentacionMovimiento(t, categoriaPorId(t.categoriaId));
      return { id: t.id, item: t.item, fecha: t.fecha, monto: t.monto, nombre, emoji };
    });
}

export interface PuntoMensual {
  mes: Date;
  ingresos: number;
  gastos: number;
}

// Ingresos y gastos de cada uno de los últimos `meses` meses hasta el elegido
// (incluido), del más viejo al más nuevo.
export function serieMensual(
  transacciones: Transaccion[],
  categoriaPorId: (id: string) => Categoria | undefined,
  hasta: Date,
  meses = 12
): PuntoMensual[] {
  const porMes = agruparPorMes(transacciones);
  const puntos: PuntoMensual[] = [];
  for (let i = meses - 1; i >= 0; i--) {
    const mes = sumarMeses(hasta, -i);
    const { ingresos, gastos } = resumirMes(porMes.get(claveMesDeFecha(mes)) ?? [], categoriaPorId);
    puntos.push({ mes, ingresos, gastos });
  }
  return puntos;
}

export interface Reparto {
  // Lo que entró y a dónde fue: lo que quedó y lo que se gastó, en 0–1.
  ingresos: number;
  gastos: number;
  quedo: number;
  fraccionQuedo: number;
  fraccionGasto: number;
  // Se gastó más de lo que entró.
  enRojo: boolean;
}

// Reparto de lo que entró en el mes (el "Ingresos ahorrados" del tablero):
// qué parte quedó y qué parte se fue. Sin ingresos no hay reparto.
export function repartoDelMes(ingresos: number, gastos: number): Reparto {
  const quedo = ingresos - gastos;
  if (ingresos <= 0) return { ingresos, gastos, quedo, fraccionQuedo: 0, fraccionGasto: 0, enRojo: gastos > 0 };
  const fraccionGasto = Math.min(1, gastos / ingresos);
  return { ingresos, gastos, quedo, fraccionQuedo: Math.max(0, 1 - fraccionGasto), fraccionGasto, enRojo: gastos > ingresos };
}

// Años con movimientos (más el actual), del más viejo al más nuevo: lo que se
// ofrece en el selector de periodo.
export function aniosConDatos(transacciones: Transaccion[], hoy: Date = new Date()): number[] {
  const anios = new Set<number>([hoy.getFullYear()]);
  for (const t of transacciones) anios.add(new Date(t.fecha).getFullYear());
  return [...anios].sort((a, b) => a - b);
}
