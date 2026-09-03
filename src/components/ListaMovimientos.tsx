import type { Categoria, Transaccion } from '../types';
import { colorCategoria } from '../utils/colorCategoria';
import { formatearFechaCorta, formatearMonto, formatearMontoConSigno } from '../utils/fechas';
import './ListaMovimientos.css';

interface Props {
  grupos: [string, Transaccion[]][];
  categoriaPorId: (id: string) => Categoria | undefined;
  onSeleccionar: (transaccion: Transaccion) => void;
}

export function ListaMovimientos({ grupos, categoriaPorId, onSeleccionar }: Props) {
  if (grupos.length === 0) {
    return (
      <div className="grafico-card">
        <h3 className="grafico-card__titulo">Movimientos recientes</h3>
        <p className="grafico-card__vacio">Aún no registras movimientos este mes.</p>
      </div>
    );
  }

  return (
    <div className="lista-movimientos">
      <h3 className="grafico-card__titulo">Movimientos recientes</h3>
      {grupos.map(([fechaClave, items]) => {
        const neto = items.reduce((acc, t) => acc + (t.tipo === 'ingreso' ? t.monto : -t.monto), 0);
        return (
          <section key={fechaClave} className="lista-movimientos__grupo">
            <div className="lista-movimientos__grupo-header">
              <span>{formatearFechaCorta(items[0].fecha)}</span>
              <span className={neto >= 0 ? 'lista-movimientos__neto--positivo' : 'lista-movimientos__neto--negativo'}>
                {formatearMontoConSigno(neto)}
              </span>
            </div>
            <ul>
              {items.map((t) => {
                const categoria = categoriaPorId(t.categoriaId);
                return (
                  <li key={t.id} className="lista-movimientos__item" onClick={() => onSeleccionar(t)}>
                    <span
                      className="lista-movimientos__avatar"
                      style={{ background: `color-mix(in srgb, ${colorCategoria(t.categoriaId)} 22%, var(--surface))` }}
                      aria-hidden
                    >
                      {categoria?.emoji ?? '🏷️'}
                    </span>
                    <span className="lista-movimientos__detalle">
                      <span className="lista-movimientos__categoria">{categoria?.nombre ?? 'Otros'}</span>
                      <span className="lista-movimientos__descripcion">{t.item}</span>
                    </span>
                    <span className={`lista-movimientos__monto lista-movimientos__monto--${t.tipo}`}>
                      {t.tipo === 'ingreso' ? '+' : '-'}
                      {formatearMonto(t.monto)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
