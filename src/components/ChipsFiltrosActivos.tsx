import type { Dispatch, SetStateAction } from 'react';
import type { Categoria } from '../types';
import { capitalizarPrimera, nombreMes } from '../utils/fechas';
import { FILTROS_INICIALES, type FiltrosHistorial } from '../utils/filtrosHistorial';
import { ChipOpcion } from './ChipOpcion';

interface Props {
  filtros: FiltrosHistorial;
  setFiltros: Dispatch<SetStateAction<FiltrosHistorial>>;
  categoriaPorId: (id: string) => Categoria | undefined;
  quitarCategoria: (id: string) => void;
  etiquetaMonto: string | null;
  // En el celular la fila se desplaza de lado; en escritorio se envuelve.
  envolver?: boolean;
}

// Un chip por cada filtro activo del Historial, cada uno con su "x", y
// "Limpiar todo" al final.
export function ChipsFiltrosActivos({ filtros, setFiltros, categoriaPorId, quitarCategoria, etiquetaMonto, envolver = false }: Props) {
  return (
    <div
      className={envolver ? 'flex flex-wrap gap-2' : 'flex gap-2 overflow-x-auto px-4 pt-3 pb-1 [scrollbar-width:none]'}
      role="group"
      aria-label="Filtros activos"
    >
      {Array.from(filtros.categoriaIds).map((id) => {
        const cat = categoriaPorId(id);
        return (
          <ChipOpcion key={id} activo onClick={() => quitarCategoria(id)} onQuitar={() => quitarCategoria(id)}>
            {cat?.emoji} {cat?.nombre ?? 'Categoría'}
          </ChipOpcion>
        );
      })}
      {filtros.tipo !== 'todos' && (
        <ChipOpcion
          activo
          onClick={() => setFiltros((prev) => ({ ...prev, tipo: 'todos' }))}
          onQuitar={() => setFiltros((prev) => ({ ...prev, tipo: 'todos' }))}
        >
          {filtros.tipo === 'ingreso' ? 'Ingresos' : 'Gastos'}
        </ChipOpcion>
      )}
      {filtros.soloFijos && (
        <ChipOpcion
          activo
          onClick={() => setFiltros((prev) => ({ ...prev, soloFijos: false }))}
          onQuitar={() => setFiltros((prev) => ({ ...prev, soloFijos: false }))}
        >
          Solo fijos
        </ChipOpcion>
      )}
      {etiquetaMonto && (
        <ChipOpcion
          activo
          onClick={() => setFiltros((prev) => ({ ...prev, montoMin: null, montoMax: null }))}
          onQuitar={() => setFiltros((prev) => ({ ...prev, montoMin: null, montoMax: null }))}
        >
          {etiquetaMonto}
        </ChipOpcion>
      )}
      {filtros.mes && (
        <ChipOpcion
          activo
          onClick={() => setFiltros((prev) => ({ ...prev, mes: null }))}
          onQuitar={() => setFiltros((prev) => ({ ...prev, mes: null }))}
        >
          {capitalizarPrimera(nombreMes(filtros.mes))}
        </ChipOpcion>
      )}
      <ChipOpcion activo={false} onClick={() => setFiltros(FILTROS_INICIALES)}>
        Limpiar todo
      </ChipOpcion>
    </div>
  );
}
