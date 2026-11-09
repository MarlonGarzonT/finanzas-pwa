import type { Categoria, Transaccion } from '../types';
import { claveMes, claveMesDeFecha } from './fechas';

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

export type EstadoGasto = 'bien' | 'atento' | 'excedido' | 'sin-ingresos' | 'sin-movimientos';

export interface ResumenMovimientos {
  ingresos: number;
  egresos: number;
  neto: number;
  // Qué fracción de lo que entró ya se gastó (0.45 = 45%). null si no entró nada.
  proporcionGastada: number | null;
  estado: EstadoGasto;
}

// Umbral desde el que se avisa "Ojo": ya se fue la mayor parte de lo que entró.
const UMBRAL_ATENCION = 0.8;

export function resumirMovimientos(transacciones: Transaccion[]): ResumenMovimientos {
  let ingresos = 0;
  let egresos = 0;
  for (const t of transacciones) {
    if (t.tipo === 'ingreso') ingresos += t.monto;
    else egresos += t.monto;
  }
  const proporcionGastada = ingresos > 0 ? egresos / ingresos : null;
  let estado: EstadoGasto;
  if (ingresos === 0 && egresos === 0) estado = 'sin-movimientos';
  else if (proporcionGastada === null) estado = 'sin-ingresos';
  else if (proporcionGastada > 1) estado = 'excedido';
  else if (proporcionGastada >= UMBRAL_ATENCION) estado = 'atento';
  else estado = 'bien';
  return { ingresos, egresos, neto: ingresos - egresos, proporcionGastada, estado };
}

export interface MesIngresosEgresos {
  mes: Date;
  ingresos: number;
  egresos: number;
}

// Entradas y salidas de los últimos `cantidad` meses, terminando en `mesFinal`
// (incluido), del más viejo al más reciente. Los meses sin movimientos van en
// cero para que el gráfico no salte huecos. claveMes (hora local) y no
// fecha.slice(0, 7) (UTC): un gasto del último día a las 9 p. m. en Colombia
// ya es el mes siguiente en UTC.
export function ingresosEgresosPorMes(
  transacciones: Transaccion[],
  mesFinal: Date,
  cantidad: number
): MesIngresosEgresos[] {
  const meses = Array.from({ length: cantidad }, (_, i) => {
    const mes = new Date(mesFinal.getFullYear(), mesFinal.getMonth() - (cantidad - 1 - i), 1);
    return { mes, clave: claveMesDeFecha(mes), ingresos: 0, egresos: 0 };
  });
  const porClave = new Map(meses.map((m) => [m.clave, m]));
  for (const t of transacciones) {
    const fila = porClave.get(claveMes(t.fecha));
    if (!fila) continue;
    if (t.tipo === 'ingreso') fila.ingresos += t.monto;
    else fila.egresos += t.monto;
  }
  return meses.map(({ mes, ingresos, egresos }) => ({ mes, ingresos, egresos }));
}
