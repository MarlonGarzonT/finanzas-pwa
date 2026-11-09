import type { Categoria, Transaccion } from '../types';

export interface Presentacion {
  nombre: string;
  emoji: string;
}

// Nombre y emoji con que se muestra un movimiento en listas y en el Excel. Los
// de préstamos no tienen categoría: se reconocen por su prestamoId.
export function presentacionMovimiento(t: Transaccion, categoria: Categoria | undefined): Presentacion {
  if (t.prestamoId) return { nombre: t.tipo === 'egreso' ? 'Préstamo' : 'Abono de préstamo', emoji: '🤝' };
  return { nombre: categoria?.nombre ?? 'Otros', emoji: categoria?.emoji ?? '🏷️' };
}
