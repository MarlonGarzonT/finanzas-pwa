import type { Categoria, Transaccion } from '../types';
import { claveMesDeFecha } from './fechas';

export interface SegmentoCategoria {
  categoriaId: string;
  nombre: string;
  emoji: string;
  monto: number;
  porcentaje: number;
}

// Desglose por categoría de un tipo (ingreso/egreso) dentro del mes, ordenado
// de mayor a menor. Útil tanto para la dona como para su leyenda.
export function desglosePorCategoria(
  transaccionesDelMes: Transaccion[],
  categoriaPorId: (id: string) => Categoria | undefined,
  tipo: 'ingreso' | 'egreso'
): SegmentoCategoria[] {
  const totales = new Map<string, number>();
  let total = 0;
  for (const t of transaccionesDelMes) {
    if (t.tipo !== tipo) continue;
    totales.set(t.categoriaId, (totales.get(t.categoriaId) ?? 0) + t.monto);
    total += t.monto;
  }
  return Array.from(totales.entries())
    .map(([categoriaId, monto]) => {
      const cat = categoriaPorId(categoriaId);
      return {
        categoriaId,
        nombre: cat?.nombre ?? 'Otros',
        emoji: cat?.emoji ?? '🏷️',
        monto,
        porcentaje: total > 0 ? (monto / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.monto - a.monto);
}

// % de los ingresos que quedó sin gastar. Puede ser negativo (se gastó más
// de lo que entró) - se deja así, sin recortar, para no ocultar la señal.
export function tasaAhorro(totalIngresos: number, totalEgresos: number): number {
  if (totalIngresos <= 0) return 0;
  return ((totalIngresos - totalEgresos) / totalIngresos) * 100;
}

export interface FijoVariable {
  fijo: number;
  variable: number;
  porcentajeFijo: number;
}

// Cuánto de lo gastado es "fijo" (arriendo, cuotas - el esFijo que ya existe
// en categorías) contra lo que es variable/discrecional.
export function fijoVsVariable(
  transaccionesDelMes: Transaccion[],
  categoriaPorId: (id: string) => Categoria | undefined
): FijoVariable {
  let fijo = 0;
  let variable = 0;
  for (const t of transaccionesDelMes) {
    if (t.tipo !== 'egreso') continue;
    if (categoriaPorId(t.categoriaId)?.esFijo) fijo += t.monto;
    else variable += t.monto;
  }
  const total = fijo + variable;
  return { fijo, variable, porcentajeFijo: total > 0 ? (fijo / total) * 100 : 0 };
}

export interface GastoSemanal {
  semana: number;
  monto: number;
}

// Egresos agrupados por semana del mes (1-5), usando semanaDelMes que ya se
// guarda en cada transacción.
export function gastoPorSemana(transaccionesDelMes: Transaccion[]): GastoSemanal[] {
  const totales = new Map<number, number>();
  for (const t of transaccionesDelMes) {
    if (t.tipo !== 'egreso') continue;
    totales.set(t.semanaDelMes, (totales.get(t.semanaDelMes) ?? 0) + t.monto);
  }
  return Array.from(totales.entries())
    .sort(([a], [b]) => a - b)
    .map(([semana, monto]) => ({ semana, monto }));
}

// Compara el total de egresos del mes seleccionado contra el mes anterior.
// null cuando no hay datos del mes anterior para comparar (evita mostrar un
// "+100%" engañoso contra cero).
export function compararConMesAnterior(
  transacciones: Transaccion[],
  mesSeleccionado: Date
): { actual: number; anterior: number; deltaPorcentaje: number } | null {
  const mesAnteriorFecha = new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() - 1, 1);
  const claveActual = claveMesDeFecha(mesSeleccionado);
  const claveAnterior = claveMesDeFecha(mesAnteriorFecha);

  let actual = 0;
  let anterior = 0;
  for (const t of transacciones) {
    if (t.tipo !== 'egreso') continue;
    const clave = t.fecha.slice(0, 7);
    if (clave === claveActual) actual += t.monto;
    else if (clave === claveAnterior) anterior += t.monto;
  }
  if (anterior <= 0) return null;
  return { actual, anterior, deltaPorcentaje: ((actual - anterior) / anterior) * 100 };
}

// Proyección lineal de gasto a fin de mes, a partir de lo gastado hasta hoy.
// Solo tiene sentido para el mes en curso (se valida afuera, no aquí).
export function proyeccionFinDeMes(totalEgresosDelMes: number, mesSeleccionado: Date): number {
  const hoy = new Date();
  const diasTranscurridos = hoy.getDate();
  const diasDelMes = new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() + 1, 0).getDate();
  if (diasTranscurridos <= 0) return totalEgresosDelMes;
  return (totalEgresosDelMes / diasTranscurridos) * diasDelMes;
}

export function esMesActual(mesSeleccionado: Date): boolean {
  const hoy = new Date();
  return mesSeleccionado.getFullYear() === hoy.getFullYear() && mesSeleccionado.getMonth() === hoy.getMonth();
}
