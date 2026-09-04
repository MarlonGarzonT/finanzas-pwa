import type { Tipo } from '../types';
import { formatearMonto } from '../utils/fechas';
import './BalanceCard.css';

interface Props {
  disponible: number;
  totalIngresos: number;
  totalEgresos: number;
  filtro: Tipo;
  onFiltroChange: (filtro: Tipo) => void;
}

export function BalanceCard({ disponible, totalIngresos, totalEgresos, filtro, onFiltroChange }: Props) {
  const estado = disponible > 0 ? 'positivo' : disponible < 0 ? 'negativo' : 'neutro';
  const signo = disponible > 0 ? '+' : disponible < 0 ? '−' : '';

  return (
    <div className={`balance-card balance-card--${estado}`}>
      <span className="balance-card__label">Disponible</span>
      <div className="balance-card__monto">
        {signo && <span className="balance-card__signo">{signo}</span>}
        <span className="balance-card__valor">{formatearMonto(Math.abs(disponible))}</span>
      </div>
      <div className="balance-card__pills">
        <button
          type="button"
          className={`balance-card__pill balance-card__pill--egreso ${filtro === 'egreso' ? 'balance-card__pill--activo' : ''}`}
          onClick={() => onFiltroChange('egreso')}
          aria-pressed={filtro === 'egreso'}
        >
          <span className="balance-card__pill-icono">−</span>
          {formatearMonto(totalEgresos)}
        </button>
        <button
          type="button"
          className={`balance-card__pill balance-card__pill--ingreso ${filtro === 'ingreso' ? 'balance-card__pill--activo' : ''}`}
          onClick={() => onFiltroChange('ingreso')}
          aria-pressed={filtro === 'ingreso'}
        >
          <span className="balance-card__pill-icono">+</span>
          {formatearMonto(totalIngresos)}
        </button>
      </div>
    </div>
  );
}
