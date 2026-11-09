import { ListItem } from 'konsta/react';
import type { Categoria, Transaccion } from '../types';
import { colorCategoria } from '../utils/colorCategoria';
import { formatearMonto } from '../utils/fechas';
import { AvatarEmoji } from './AvatarEmoji';

interface Props {
  transaccion: Transaccion;
  categoria: Categoria | undefined;
  onSeleccionar: (transaccion: Transaccion) => void;
  detalle?: string;
}

// Fila de un movimiento (Resumen e Historial). Toda la fila es un botón que
// abre el editor; el monto lleva siempre su signo en texto, no solo color.
export function FilaMovimiento({ transaccion, categoria, onSeleccionar, detalle }: Props) {
  const esIngreso = transaccion.tipo === 'ingreso';
  return (
    <ListItem
      link
      chevron={false}
      linkComponent="button"
      linkProps={{ type: 'button', 'aria-label': `${transaccion.item}, ${esIngreso ? 'ingreso' : 'gasto'} de ${formatearMonto(transaccion.monto)}. Editar` }}
      onClick={() => onSeleccionar(transaccion)}
      media={<AvatarEmoji emoji={categoria?.emoji ?? '🏷️'} color={colorCategoria(transaccion.categoriaId)} />}
      title={<span className="block truncate">{transaccion.item}</span>}
      subtitle={<span className="block truncate text-secundario">{detalle ?? categoria?.nombre ?? 'Otros'}</span>}
      after={
        <span className={`text-[17px] font-semibold cifras ${esIngreso ? 'text-ingreso' : 'text-black dark:text-white'}`}>
          {esIngreso ? '+' : '−'}
          {formatearMonto(transaccion.monto)}
        </span>
      }
      contentClassName="w-full text-left [&_.shrink]:min-w-0"
    />
  );
}
