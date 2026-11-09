import type { Prestamo, Transaccion } from '../types';
import { fechaDesdeISO, fechaLocalISO } from './fechas';

const MS_POR_DIA = 86_400_000;

// '2026-11-05' → "5 nov" (mismo formato corto de las listas de la app).
export function formatearDia(iso: string): string {
  return fechaDesdeISO(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

export interface EstadoPrestamo extends Prestamo {
  // Fecha de la salida del préstamo (ISO); null si no se encontró.
  fechaPrestamo: string | null;
  // Del más reciente al más viejo.
  abonos: Transaccion[];
  abonado: number;
  saldo: number;
  pagado: boolean;
  // Fecha del abono que lo dejó en cero.
  fechaPago: string | null;
  // Se pasó la fecha en que quedó de pagar y todavía debe algo.
  vencido: boolean;
  diasVencido: number;
}

export function estadosPrestamos(
  prestamos: Prestamo[],
  transacciones: Transaccion[],
  hoy: Date = new Date()
): EstadoPrestamo[] {
  const movimientos = new Map<string, Transaccion[]>();
  for (const t of transacciones) {
    if (!t.prestamoId) continue;
    const lista = movimientos.get(t.prestamoId);
    if (lista) lista.push(t);
    else movimientos.set(t.prestamoId, [t]);
  }
  const hoyLocal = fechaLocalISO(hoy);
  const inicioDeHoy = fechaDesdeISO(hoyLocal).getTime();

  return prestamos.map((p) => {
    const propios = movimientos.get(p.id) ?? [];
    const salida = propios.find((t) => t.tipo === 'egreso');
    const abonos = propios
      .filter((t) => t.tipo === 'ingreso')
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    const abonado = abonos.reduce((acc, t) => acc + t.monto, 0);
    const saldo = Math.max(0, p.monto - abonado);
    const pagado = saldo === 0;
    const vencido = !pagado && p.fechaDevolucion < hoyLocal;
    return {
      ...p,
      fechaPrestamo: salida?.fecha ?? null,
      abonos,
      abonado,
      saldo,
      pagado,
      fechaPago: pagado ? (abonos[0]?.fecha ?? null) : null,
      vencido,
      diasVencido: vencido ? Math.round((inicioDeHoy - fechaDesdeISO(p.fechaDevolucion).getTime()) / MS_POR_DIA) : 0,
    };
  });
}

export interface ResumenPrestamos {
  // Lo que te deben entre todos los préstamos sin pagar.
  pendiente: number;
  pendientes: number;
  vencidos: number;
}

export function resumirPrestamos(estados: EstadoPrestamo[]): ResumenPrestamos {
  let pendiente = 0;
  let pendientes = 0;
  let vencidos = 0;
  for (const e of estados) {
    if (e.pagado) continue;
    pendiente += e.saldo;
    pendientes += 1;
    if (e.vencido) vencidos += 1;
  }
  return { pendiente, pendientes, vencidos };
}
