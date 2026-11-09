import type { Categoria } from '../types';
import { colorCategoria } from '../utils/colorCategoria';
import { IconoCheck, IconoMas } from './Iconos';

interface Props {
  categorias: Categoria[];
  estaElegida: (id: string) => boolean;
  onElegir: (id: string) => void;
  // true en los filtros: se pueden marcar varias (checkbox en vez de radio).
  multiple?: boolean;
  etiqueta?: string;
  onNueva?: () => void;
}

// Cuadrícula de 4 columnas, como los selectores de categoría de iOS: cada
// opción es el emoji sobre el color de identidad de la categoría (el mismo
// de las listas y los gráficos) con su nombre debajo, así todas las filas
// quedan alineadas. Con una sola elección es un grupo de radio; en los
// filtros (multiple) cada opción es un checkbox.
export function SelectorCategoria({
  categorias,
  estaElegida,
  onElegir,
  multiple = false,
  etiqueta = 'Categoría',
  onNueva,
}: Props) {
  return (
    <div
      role={multiple ? 'group' : 'radiogroup'}
      aria-label={etiqueta}
      className="grid grid-cols-4 gap-x-1 gap-y-2 px-3"
    >
      {categorias.map((c) => {
        const activa = estaElegida(c.id);
        return (
          <button
            key={c.id}
            type="button"
            role={multiple ? 'checkbox' : 'radio'}
            aria-checked={activa}
            onClick={() => onElegir(c.id)}
            className="flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-1 pt-1.5 pb-1 transition-transform duration-150 active:scale-95"
          >
            <span
              className={`relative flex size-13 items-center justify-center rounded-full text-[26px] transition-[box-shadow,scale] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                activa
                  ? 'scale-105 ring-2 ring-primary ring-offset-2 ring-offset-ios-light-surface dark:ring-offset-ios-dark-surface-2'
                  : ''
              }`}
              style={{ background: `color-mix(in srgb, ${colorCategoria(c.id)} 26%, transparent)` }}
              aria-hidden="true"
            >
              {c.emoji}
              {activa && (
                <span className="seleccion-pop absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-primary text-white ring-2 ring-ios-light-surface dark:ring-ios-dark-surface-2">
                  <IconoCheck className="size-3" />
                </span>
              )}
            </span>
            <span
              className={`line-clamp-2 w-full text-center text-[13px] leading-tight ${
                activa ? 'font-semibold text-primary' : 'text-black/80 dark:text-white/85'
              }`}
            >
              {c.nombre}
            </span>
          </button>
        );
      })}

      {onNueva && (
        <button
          type="button"
          onClick={onNueva}
          className="flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-1 pt-1.5 pb-1 text-primary transition-transform duration-150 active:scale-95"
        >
          <span
            className="flex size-13 items-center justify-center rounded-full border-2 border-dashed border-primary/45"
            aria-hidden="true"
          >
            <IconoMas className="size-6" />
          </span>
          <span className="text-[13px] leading-tight font-medium">Nueva</span>
        </button>
      )}
    </div>
  );
}
