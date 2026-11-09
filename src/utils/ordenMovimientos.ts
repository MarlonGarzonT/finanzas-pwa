import type { Transaccion } from '../types';

// Del más reciente al más viejo. Se compara el instante y no el texto ISO:
// Postgres no siempre devuelve la misma cantidad de decimales en los segundos.
// A igual instante, el id desempata para que el orden no salte entre renders.
export function compararPorFechaDesc(a: Transaccion, b: Transaccion): number {
  return new Date(b.fecha).getTime() - new Date(a.fecha).getTime() || b.id.localeCompare(a.id);
}

// Inserta o reemplaza movimientos manteniendo el orden por fecha: un gasto
// registrado para el día 3 no debe quedar arriba de los del 8 solo por ser el
// último que se creó, y editar la fecha de uno debe moverlo a su lugar.
export function conMovimientos(lista: Transaccion[], nuevos: Transaccion[]): Transaccion[] {
  const ids = new Set(nuevos.map((t) => t.id));
  return [...lista.filter((t) => !ids.has(t.id)), ...nuevos].sort(compararPorFechaDesc);
}
