import type { Categoria, Tipo, Transaccion } from '../types';
import { capitalizarPrimera, claveMes, claveMesDeFecha, nombreMes } from './fechas';
import { compararPorFechaDesc } from './ordenMovimientos';

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

export interface GrupoMes {
  // 'AAAA-MM' en hora local.
  clave: string;
  // "Noviembre de 2026".
  titulo: string;
  movimientos: Transaccion[];
}

// Agrupa por mes (en hora local), del mes más reciente al más viejo. Ordena
// por su cuenta en vez de confiar en el orden en que llegaron: el primer
// movimiento del primer grupo es siempre el más reciente. Con orden 'monto'
// los meses siguen de nuevo a viejo y dentro de cada mes va el más grande
// primero.
export function agruparPorMes(transacciones: Transaccion[], orden: OrdenHistorial): GrupoMes[] {
  const grupos = new Map<string, GrupoMes>();
  for (const t of [...transacciones].sort(compararPorFechaDesc)) {
    const clave = claveMes(t.fecha);
    let grupo = grupos.get(clave);
    if (!grupo) {
      grupo = { clave, titulo: capitalizarPrimera(nombreMes(new Date(t.fecha))), movimientos: [] };
      grupos.set(clave, grupo);
    }
    grupo.movimientos.push(t);
  }
  const lista = Array.from(grupos.values());
  if (orden === 'monto') {
    for (const g of lista) g.movimientos.sort((a, b) => b.monto - a.monto || compararPorFechaDesc(a, b));
  }
  return lista;
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
