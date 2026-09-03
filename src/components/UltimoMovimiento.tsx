import type { Categoria, Transaccion } from '../types';
import { colorCategoria } from '../utils/colorCategoria';
import { formatearMonto } from '../utils/fechas';
import './UltimoMovimiento.css';

interface Props {
  transaccion: Transaccion | null;
  categoriaPorId: (id: string) => Categoria | undefined;
  onSeleccionar: (transaccion: Transaccion) => void;
}

export function UltimoMovimiento({ transaccion, categoriaPorId, onSeleccionar }: Props) {
  if (!transaccion) {
    return (
      <div className="ultimo-movimiento">
        <h3 className="grafico-card__titulo">Último movimiento</h3>
        <p className="ultimo-movimiento__vacio">Aún no registras movimientos.</p>
      </div>
    );
  }

  const categoria = categoriaPorId(transaccion.categoriaId);

  return (
    <div className="ultimo-movimiento">
      <h3 className="grafico-card__titulo">Último movimiento</h3>
      <ul>
        <li className="ultimo-movimiento__item" onClick={() => onSeleccionar(transaccion)}>
          <span
            className="ultimo-movimiento__avatar"
            style={{ background: `color-mix(in srgb, ${colorCategoria(transaccion.categoriaId)} 22%, var(--surface))` }}
            aria-hidden
          >
            {categoria?.emoji ?? '🏷️'}
          </span>
          <span className="ultimo-movimiento__detalle">
            <span className="ultimo-movimiento__categoria">{categoria?.nombre ?? 'Otros'}</span>
            <span className="ultimo-movimiento__descripcion">{transaccion.item}</span>
          </span>
          <span className={`ultimo-movimiento__monto ultimo-movimiento__monto--${transaccion.tipo}`}>
            {transaccion.tipo === 'ingreso' ? '+' : '-'}
            {formatearMonto(transaccion.monto)}
          </span>
        </li>
      </ul>
    </div>
  );
}
