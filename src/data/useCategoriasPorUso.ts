import { useMemo } from 'react';
import type { Categoria, Tipo } from '../types';
import { useFinanzas } from './FinanzasContext';

// Categorías de un tipo ordenadas por cuántas veces se han usado (las de
// todos los días quedan en la primera fila del selector) y, a igual uso,
// por nombre. Un orden alfabético fijo hacía que la categoría más frecuente
// pudiera quedar al fondo.
export function useCategoriasPorUso(categorias: Categoria[], tipo: Tipo): Categoria[] {
  const { transacciones } = useFinanzas();

  return useMemo(() => {
    const usos = new Map<string, number>();
    for (const t of transacciones) {
      if (t.tipo === tipo) usos.set(t.categoriaId, (usos.get(t.categoriaId) ?? 0) + 1);
    }
    return categorias
      .filter((c) => c.tipo === tipo)
      .sort((a, b) => (usos.get(b.id) ?? 0) - (usos.get(a.id) ?? 0) || a.nombre.localeCompare(b.nombre, 'es'));
  }, [categorias, transacciones, tipo]);
}
