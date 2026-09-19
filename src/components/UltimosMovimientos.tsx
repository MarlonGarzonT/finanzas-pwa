import type { Categoria, Transaccion } from '../types';
import { colorCategoria } from '../utils/colorCategoria';
import { formatearMonto } from '../utils/fechas';
import './UltimosMovimientos.css';

interface Props {
  transacciones: Transaccion[];
  categoriaPorId: (id: string) => Categoria | undefined;
  onSeleccionar: (transaccion: Transaccion) => void;
  mensajeVacio?: string;
}

export function UltimosMovimientos({
  transacciones,
  categoriaPorId,
  onSeleccionar,
  mensajeVacio = 'Aún no registras movimientos.',
}: Props) {
  if (transacciones.length === 0) {
    return (
      <div className="ultimos-movimientos">
        <h3 className="grafico-card__titulo">Últimos movimientos</h3>
        <p className="ultimos-movimientos__vacio">{mensajeVacio}</p>
      </div>
    );
  }

  return (
    <div className="ultimos-movimientos">
      <h3 className="grafico-card__titulo">Últimos movimientos</h3>
      <ul>
        {transacciones.map((transaccion) => {
          const categoria = categoriaPorId(transaccion.categoriaId);
          return (
            <li key={transaccion.id} className="ultimos-movimientos__item" onClick={() => onSeleccionar(transaccion)}>
              <span
                className="ultimos-movimientos__avatar"
                style={{
                  background: `color-mix(in srgb, ${colorCategoria(transaccion.categoriaId)} 22%, var(--surface))`,
                }}
                aria-hidden
              >
                {categoria?.emoji ?? '🏷️'}
              </span>
              <span className="ultimos-movimientos__detalle">
                <span className="ultimos-movimientos__categoria">{categoria?.nombre ?? 'Otros'}</span>
                <span className="ultimos-movimientos__descripcion">{transaccion.item}</span>
              </span>
              <span className={`ultimos-movimientos__monto ultimos-movimientos__monto--${transaccion.tipo}`}>
                {transaccion.tipo === 'ingreso' ? '+' : '-'}
                {formatearMonto(transaccion.monto)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
