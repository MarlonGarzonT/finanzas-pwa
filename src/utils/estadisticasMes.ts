import type { Categoria, GastoAnual, Transaccion } from '../types';
import { clasificar, esGasto, esIngreso, resumirMes, type ResumenContable } from './contabilidad';
import { claveMes, claveMesDeFecha } from './fechas';
import { esPagoDeGastoAnual } from './provisiones';

export interface SegmentoCategoria {
  categoriaId: string;
  nombre: string;
  emoji: string;
  monto: number;
  porcentaje: number;
}

// Desglose por categoría de lo que se gastó (o de lo que entró) en el mes,
// de mayor a menor. Útil tanto para la dona como para su leyenda. El ahorro,
// el pago de tarjeta y los préstamos o devoluciones no son gasto ni ingreso:
// no aparecen.
export function desglosePorCategoria(
  transaccionesDelMes: Transaccion[],
  categoriaPorId: (id: string) => Categoria | undefined,
  tipo: 'ingreso' | 'egreso'
): SegmentoCategoria[] {
  const cuenta = tipo === 'egreso' ? esGasto : esIngreso;
  const totales = new Map<string, number>();
  let total = 0;
  for (const t of transaccionesDelMes) {
    if (!cuenta(clasificar(t, categoriaPorId(t.categoriaId)))) continue;
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

// Cuánto de lo gastado es "fijo" (arriendo, cuotas: el esFijo de la
// categoría) contra lo que es variable o discrecional.
export function fijoVsVariable(
  transaccionesDelMes: Transaccion[],
  categoriaPorId: (id: string) => Categoria | undefined
): FijoVariable {
  let fijo = 0;
  let variable = 0;
  for (const t of transaccionesDelMes) {
    const categoria = categoriaPorId(t.categoriaId);
    if (!esGasto(clasificar(t, categoria))) continue;
    if (categoria?.esFijo) fijo += t.monto;
    else variable += t.monto;
  }
  const total = fijo + variable;
  return { fijo, variable, porcentajeFijo: total > 0 ? (fijo / total) * 100 : 0 };
}

export function esMesActual(mesSeleccionado: Date, hoy: Date = new Date()): boolean {
  return mesSeleccionado.getFullYear() === hoy.getFullYear() && mesSeleccionado.getMonth() === hoy.getMonth();
}

function diasDelMes(mes: Date): number {
  return new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
}

export interface ComparacionMensual {
  actual: number;
  anterior: number;
  deltaPorcentaje: number;
  mesAnterior: Date;
  // Día hasta el que se suman los dos meses cuando se mira el mes en curso;
  // null cuando se comparan dos meses completos.
  corte: number | null;
}

// Gasto variable del mes elegido frente al del mes anterior. Los fijos caen
// en días puntuales (el arriendo el 1, la cuota el 5) y solo meten ruido; los
// pagos de gastos del año (la matrícula en enero) tampoco cuentan. En el mes
// en curso se compara a igual fecha: del 1 a hoy contra del 1 al mismo día
// del mes anterior, para no comparar medio mes contra uno completo.
export function compararConMesAnterior(
  transacciones: Transaccion[],
  mesSeleccionado: Date,
  categoriaPorId: (id: string) => Categoria | undefined,
  hoy: Date = new Date(),
  gastosAnuales: GastoAnual[] = []
): ComparacionMensual | null {
  const mesAnterior = new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() - 1, 1);

  // Si la persona empezó a registrar después del día 1 del mes anterior, ese
  // mes está incompleto y cualquier porcentaje sería engañoso.
  let primerMovimiento = Infinity;
  for (const t of transacciones) primerMovimiento = Math.min(primerMovimiento, new Date(t.fecha).getTime());
  const inicioDelDia2 = new Date(mesAnterior.getFullYear(), mesAnterior.getMonth(), 2).getTime();
  if (primerMovimiento >= inicioDelDia2) return null;

  const corte = esMesActual(mesSeleccionado, hoy) ? hoy.getDate() : null;
  const limiteActual = corte ?? Infinity;
  const limiteAnterior = corte === null ? Infinity : Math.min(corte, diasDelMes(mesAnterior));
  const claveActual = claveMesDeFecha(mesSeleccionado);
  const claveAnterior = claveMesDeFecha(mesAnterior);

  let actual = 0;
  let anterior = 0;
  for (const t of transacciones) {
    const categoria = categoriaPorId(t.categoriaId);
    if (!esGasto(clasificar(t, categoria)) || categoria?.esFijo) continue;
    if (esPagoDeGastoAnual(t, gastosAnuales)) continue;
    const fecha = new Date(t.fecha);
    const clave = claveMesDeFecha(fecha);
    if (clave === claveActual && fecha.getDate() <= limiteActual) actual += t.monto;
    else if (clave === claveAnterior && fecha.getDate() <= limiteAnterior) anterior += t.monto;
  }
  if (anterior <= 0) return null;
  return { actual, anterior, deltaPorcentaje: ((actual - anterior) / anterior) * 100, mesAnterior, corte };
}

// Antes de una semana el ritmo diario es puro ruido (un mercado grande el
// día 2 proyecta un mes imposible).
const DIAS_MINIMOS_PROYECCION = 7;

// Gasto estimado al cierre del mes en curso. Los fijos se suman tal cual (el
// arriendo no se paga otra vez por llevar más días); solo el gasto variable
// se extrapola al ritmo de lo que va del mes.
// En la Fase 2 (B3, recurrentes) aquí se sumarán además los egresos
// recurrentes que aún no se confirman este mes.
export function proyeccionFinDeMes(
  transaccionesDelMes: Transaccion[],
  categoriaPorId: (id: string) => Categoria | undefined,
  mesSeleccionado: Date,
  hoy: Date = new Date()
): number | null {
  if (!esMesActual(mesSeleccionado, hoy) || hoy.getDate() < DIAS_MINIMOS_PROYECCION) return null;
  const { fijo, variable } = fijoVsVariable(transaccionesDelMes, categoriaPorId);
  return fijo + (variable / hoy.getDate()) * diasDelMes(mesSeleccionado);
}

export type EstadoGasto = 'bien' | 'atento' | 'excedido' | 'sin-ingresos' | 'sin-movimientos';

export interface ResumenMovimientos {
  ingresos: number;
  // Solo gastos: el ahorro y el pago de tarjeta van aparte.
  egresos: number;
  ahorro: number;
  // Préstamos que hiciste y abonos que te hicieron (sección Préstamos).
  prestado: number;
  devuelto: number;
  // Lo que queda libre: ingresos − gastos − ahorro − prestado + devuelto.
  neto: number;
  // Qué fracción de lo que entró ya se gastó (0.45 = 45%). null si no entró nada.
  proporcionGastada: number | null;
  estado: EstadoGasto;
}

// Umbral desde el que se avisa "Ojo": ya se fue la mayor parte de lo que entró.
const UMBRAL_ATENCION = 0.8;

export function evaluarMes(resumen: ResumenContable): ResumenMovimientos {
  const { ingresos, gastos, ahorro, disponible, prestamosDados, prestamosCobrados } = resumen;
  const proporcionGastada = ingresos > 0 ? gastos / ingresos : null;
  let estado: EstadoGasto;
  if (ingresos === 0 && gastos === 0 && ahorro === 0 && prestamosDados === 0) estado = 'sin-movimientos';
  else if (proporcionGastada === null) estado = 'sin-ingresos';
  else if (proporcionGastada > 1) estado = 'excedido';
  else if (proporcionGastada >= UMBRAL_ATENCION) estado = 'atento';
  else estado = 'bien';
  return {
    ingresos,
    egresos: gastos,
    ahorro,
    prestado: prestamosDados,
    devuelto: prestamosCobrados,
    neto: disponible,
    proporcionGastada,
    estado,
  };
}

export function resumirMovimientos(
  transacciones: Transaccion[],
  categoriaPorId: (id: string) => Categoria | undefined
): ResumenMovimientos {
  return evaluarMes(resumirMes(transacciones, categoriaPorId));
}

export interface MesIngresosEgresos {
  mes: Date;
  ingresos: number;
  egresos: number;
}

// Entradas y gastos de los últimos `cantidad` meses, terminando en `mesFinal`
// (incluido), del más viejo al más reciente. Los meses sin movimientos van en
// cero para que el gráfico no salte huecos. claveMes (hora local) y no
// fecha.slice(0, 7) (UTC): un gasto del último día a las 9 p. m. en Colombia
// ya es el mes siguiente en UTC.
export function ingresosEgresosPorMes(
  transacciones: Transaccion[],
  mesFinal: Date,
  cantidad: number,
  categoriaPorId: (id: string) => Categoria | undefined
): MesIngresosEgresos[] {
  const meses = Array.from({ length: cantidad }, (_, i) => {
    const mes = new Date(mesFinal.getFullYear(), mesFinal.getMonth() - (cantidad - 1 - i), 1);
    return { mes, clave: claveMesDeFecha(mes), ingresos: 0, egresos: 0 };
  });
  const porClave = new Map(meses.map((m) => [m.clave, m]));
  for (const t of transacciones) {
    const fila = porClave.get(claveMes(t.fecha));
    if (!fila) continue;
    const clase = clasificar(t, categoriaPorId(t.categoriaId));
    if (esIngreso(clase)) fila.ingresos += t.monto;
    else if (esGasto(clase)) fila.egresos += t.monto;
  }
  return meses.map(({ mes, ingresos, egresos }) => ({ mes, ingresos, egresos }));
}
