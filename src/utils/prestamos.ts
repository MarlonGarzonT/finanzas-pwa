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
  // Lo prestado y lo ya devuelto en los préstamos sin pagar: con eso se
  // dibuja "te han devuelto X de Y" sin contar los que ya se cerraron.
  prestadoPendientes: number;
  devueltoPendientes: number;
}

export function resumirPrestamos(estados: EstadoPrestamo[]): ResumenPrestamos {
  let pendiente = 0;
  let pendientes = 0;
  let vencidos = 0;
  let prestadoPendientes = 0;
  let devueltoPendientes = 0;
  for (const e of estados) {
    if (e.pagado) continue;
    pendiente += e.saldo;
    pendientes += 1;
    prestadoPendientes += e.monto;
    devueltoPendientes += e.abonado;
    if (e.vencido) vencidos += 1;
  }
  return { pendiente, pendientes, vencidos, prestadoPendientes, devueltoPendientes };
}

export type TonoVencimiento = 'tranquilo' | 'pronto' | 'vencido' | 'pagado';

// Cuándo te paga, dicho como lo diría una persona: "mañana", "en 3 días",
// "venció hace 2 días". El tono decide el color y el punto del indicador
// (el estado nunca depende solo del color). "Pronto" son los 7 días antes.
export function describirVencimiento(p: EstadoPrestamo, hoy: Date = new Date()): { texto: string; tono: TonoVencimiento } {
  if (p.pagado) {
    return { texto: p.fechaPago ? `Te pagó el ${formatearDia(fechaLocalISO(new Date(p.fechaPago)))}` : 'Te pagó todo', tono: 'pagado' };
  }
  if (p.vencido) {
    return { texto: p.diasVencido === 1 ? 'Venció ayer' : `Venció hace ${p.diasVencido} días`, tono: 'vencido' };
  }
  const inicioDeHoy = fechaDesdeISO(fechaLocalISO(hoy)).getTime();
  const dias = Math.round((fechaDesdeISO(p.fechaDevolucion).getTime() - inicioDeHoy) / MS_POR_DIA);
  if (dias === 0) return { texto: 'Te paga hoy', tono: 'pronto' };
  if (dias === 1) return { texto: 'Te paga mañana', tono: 'pronto' };
  if (dias <= 7) return { texto: `Te paga en ${dias} días`, tono: 'pronto' };
  return { texto: `Te paga el ${formatearDia(p.fechaDevolucion)}`, tono: 'tranquilo' };
}

// "Juan Pérez" → "JP"; "ana" → "A". Para el avatar de la persona.
export function iniciales(persona: string): string {
  const letras = persona
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase() ?? '');
  return letras.join('') || '?';
}

export type PlazoRapido = { clave: 'semana' | 'quincena' | 'mes'; etiqueta: string };

export const PLAZOS_RAPIDOS: PlazoRapido[] = [
  { clave: 'semana', etiqueta: '1 semana' },
  { clave: 'quincena', etiqueta: '15 días' },
  { clave: 'mes', etiqueta: '1 mes' },
];

// Día en que vence un plazo rápido contado desde hoy: 'AAAA-MM-DD'.
export function fechaDePlazo(clave: PlazoRapido['clave'], hoy: Date = new Date()): string {
  const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  if (clave === 'mes') {
    // Un mes calendario: el 31-ene + 1 mes cae el último día de febrero, no en marzo.
    const dia = fecha.getDate();
    fecha.setDate(1);
    fecha.setMonth(fecha.getMonth() + 1);
    const ultimo = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
    fecha.setDate(Math.min(dia, ultimo));
  } else {
    fecha.setDate(fecha.getDate() + (clave === 'semana' ? 7 : 15));
  }
  return fechaLocalISO(fecha);
}

// Nombres ya usados, primero las personas a las que más veces les has
// prestado: se ofrecen como atajo al registrar otro préstamo a la misma gente.
export function personasFrecuentes(prestamos: Prestamo[], limite = 6): string[] {
  const porClave = new Map<string, { nombre: string; veces: number }>();
  for (const p of prestamos) {
    const nombre = p.persona.trim();
    const clave = nombre.toLowerCase();
    if (!clave) continue;
    const previo = porClave.get(clave);
    if (previo) previo.veces += 1;
    else porClave.set(clave, { nombre, veces: 1 });
  }
  return [...porClave.values()]
    .sort((a, b) => b.veces - a.veces || a.nombre.localeCompare(b.nombre, 'es'))
    .slice(0, limite)
    .map((p) => p.nombre);
}
