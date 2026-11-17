import type { Categoria, Transaccion } from '../types';
import { clasificar, esGasto, esIngreso } from './contabilidad';
import { claveMesDeFecha, sumarMeses } from './fechas';

export interface PuntoHistorial {
  // Primer día del mes al que corresponde el punto.
  mes: Date;
  // Todo lo que ha entrado y salido desde el primer movimiento hasta el
  // final de ese mes.
  ingresos: number;
  gastos: number;
}

export interface HistorialAcumulado {
  puntos: PuntoHistorial[];
  ingresos: number;
  gastos: number;
  // La brecha: lo que entró menos lo que se gastó. Negativa si se gastó más.
  brecha: number;
  // Qué parte de lo que entró no se gastó (0–1); null sin ingresos.
  tasa: number | null;
}

// Ingresos y gastos acumulados mes a mes, desde el primer movimiento hasta
// hoy. Usa la misma clasificación del resto de la app: el ahorro apartado,
// los préstamos y el pago de tarjeta no son gasto ni ingreso, así que la
// brecha incluye lo que se apartó para ahorrar. Los meses sin movimientos
// quedan planos (la curva no salta huecos). Mes en hora local, como claveMes.
export function historialAcumulado(
  transacciones: Transaccion[],
  categoriaPorId: (id: string) => Categoria | undefined,
  hoy: Date = new Date()
): HistorialAcumulado {
  const porMes = new Map<string, { ingresos: number; gastos: number }>();
  let primera: Date | null = null;
  for (const t of transacciones) {
    const clase = clasificar(t, categoriaPorId(t.categoriaId));
    const ingreso = esIngreso(clase);
    if (!ingreso && !esGasto(clase)) continue;
    // Una sola lectura de la fecha por movimiento (con miles de movimientos
    // cada new Date cuenta, sobre todo en un teléfono modesto).
    const fecha = new Date(t.fecha);
    if (!primera || fecha < primera) primera = fecha;
    const clave = claveMesDeFecha(fecha);
    const fila = porMes.get(clave) ?? { ingresos: 0, gastos: 0 };
    if (ingreso) fila.ingresos += t.monto;
    else fila.gastos += t.monto;
    porMes.set(clave, fila);
  }
  if (!primera) return { puntos: [], ingresos: 0, gastos: 0, brecha: 0, tasa: null };

  const puntos: PuntoHistorial[] = [];
  const mesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  let ingresos = 0;
  let gastos = 0;
  // Si hay movimientos con fecha futura, la curva llega hasta el último.
  let ultimo = mesActual;
  for (const clave of porMes.keys()) {
    const [anio, mes] = clave.split('-').map(Number);
    const fecha = new Date(anio, mes - 1, 1);
    if (fecha > ultimo) ultimo = fecha;
  }
  for (let mes = new Date(primera.getFullYear(), primera.getMonth(), 1); mes <= ultimo; mes = sumarMeses(mes, 1)) {
    const fila = porMes.get(claveMesDeFecha(mes));
    ingresos += fila?.ingresos ?? 0;
    gastos += fila?.gastos ?? 0;
    puntos.push({ mes, ingresos, gastos });
  }
  return { puntos, ingresos, gastos, brecha: ingresos - gastos, tasa: ingresos > 0 ? (ingresos - gastos) / ingresos : null };
}

// El historial solo cambia cuando cambian los movimientos o las categorías:
// se guarda el último resultado por cada lista de movimientos (WeakMap, así no
// retiene memoria de listas viejas) y volver a Reportes no lo recalcula.
const resultadosPorMovimientos = new WeakMap<Transaccion[], { categorias: Categoria[]; historial: HistorialAcumulado }>();

export function historialEnCache(transacciones: Transaccion[], categorias: Categoria[]): HistorialAcumulado {
  const guardado = resultadosPorMovimientos.get(transacciones);
  if (guardado && guardado.categorias === categorias) return guardado.historial;
  const porId = new Map(categorias.map((c) => [c.id, c]));
  const historial = historialAcumulado(transacciones, (id) => porId.get(id));
  resultadosPorMovimientos.set(transacciones, { categorias, historial });
  return historial;
}
