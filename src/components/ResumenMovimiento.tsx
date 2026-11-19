import type { Categoria, Tipo } from '../types';
import { colorCategoria } from '../utils/colorCategoria';
import { formatearMonto } from '../utils/fechas';
import { AvatarEmoji } from './AvatarEmoji';

interface Props {
  tipo: Tipo;
  monto: number;
  categoria: Categoria | undefined;
  onCambiarCategoria: () => void;
  onCambiarMonto: () => void;
}

// Lo ya elegido en los pasos anteriores, a la vista en el último: categoría a
// la izquierda y monto a la derecha, cada uno un botón que vuelve a su paso.
// El signo acompaña al monto en texto; solo el ingreso lleva color.
export function ResumenMovimiento({ tipo, monto, categoria, onCambiarCategoria, onCambiarMonto }: Props) {
  const esIngreso = tipo === 'ingreso';
  return (
    <div className="mx-4 flex items-stretch rounded-2xl bg-black/[0.04] dark:bg-white/[0.07]">
      <button
        type="button"
        onClick={onCambiarCategoria}
        aria-label={`Categoría ${categoria?.nombre ?? 'sin elegir'}. Cambiar`}
        className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-l-2xl px-3 text-left active:opacity-60"
      >
        {categoria && <AvatarEmoji emoji={categoria.emoji} color={colorCategoria(categoria.id)} />}
        <span className="min-w-0">
          <span className="block truncate text-[17px] font-semibold">{categoria?.nombre ?? 'Sin categoría'}</span>
          <span className="block text-[13px] text-secundario">Cambiar</span>
        </span>
      </button>
      <button
        type="button"
        onClick={onCambiarMonto}
        aria-label={`${esIngreso ? 'Ingreso' : 'Gasto'} de ${formatearMonto(monto)}. Cambiar`}
        className={`flex min-h-14 shrink-0 items-center rounded-r-2xl px-4 text-[19px] font-bold cifras active:opacity-60 ${
          esIngreso ? 'text-ingreso' : ''
        }`}
      >
        {esIngreso ? '+' : '−'}
        {formatearMonto(monto)}
      </button>
    </div>
  );
}
