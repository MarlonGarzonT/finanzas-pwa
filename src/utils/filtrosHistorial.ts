import type { Categoria, Tipo, Transaccion } from '../types';
import { claveMes, claveMesDeFecha } from './fechas';

export type OrdenHistorial = 'fecha' | 'monto';

export interface FiltrosHistorial {
  categoriaIds: Set<string>;
  tipo: Tipo | 'todos';
  texto: string;
  soloFijos: boolean;
  montoMin: number | null;
  montoMax: number | null;
  mes: Date | null;
  orden: OrdenHistorial;
}

export const FILTROS_INICIALES: FiltrosHistorial = {
  categoriaIds: new Set(),
  tipo: 'todos',
  texto: '',
  soloFijos: false,
  montoMin: null,
  montoMax: null,
  mes: null,
  orden: 'fecha',
};

// Cuenta cuántos filtros hay activos (sin contar el texto ni el orden, que
// tienen su propio control siempre visible). Útil para la insignia del botón
// "Filtros" y para saber si mostrar la fila de chips activos.
export function contarFiltrosActivos(f: FiltrosHistorial): number {
  let n = 0;
  if (f.categoriaIds.size > 0) n += f.categoriaIds.size;
  if (f.tipo !== 'todos') n += 1;
  if (f.soloFijos) n += 1;
  if (f.montoMin !== null || f.montoMax !== null) n += 1;
  if (f.mes !== null) n += 1;
  return n;
}

export function aplicarFiltros(
  transacciones: Transaccion[],
  categoriaPorId: (id: string) => Categoria | undefined,
  filtros: FiltrosHistorial
): Transaccion[] {
  const texto = filtros.texto.trim().toLowerCase();
  const claveMesFiltro = filtros.mes ? claveMesDeFecha(filtros.mes) : null;

  return transacciones.filter((t) => {
    if (filtros.categoriaIds.size > 0 && !filtros.categoriaIds.has(t.categoriaId)) return false;
    if (filtros.tipo !== 'todos' && t.tipo !== filtros.tipo) return false;
    if (texto && !t.item.toLowerCase().includes(texto)) return false;
    if (filtros.soloFijos && !categoriaPorId(t.categoriaId)?.esFijo) return false;
    if (filtros.montoMin !== null && t.monto < filtros.montoMin) return false;
    if (filtros.montoMax !== null && t.monto > filtros.montoMax) return false;
    if (claveMesFiltro && claveMes(t.fecha) !== claveMesFiltro) return false;
    return true;
  });
}
