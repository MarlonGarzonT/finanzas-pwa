import { formatearMonto } from '../utils/fechas';
import './BalanceCard.css';

export function BalanceCard({ disponible }: { disponible: number }) {
  const estado = disponible > 0 ? 'positivo' : disponible < 0 ? 'negativo' : 'neutro';
  return (
    <div className={`balance-card balance-card--${estado}`}>
      <span className="balance-card__label">Disponible</span>
      <span className="balance-card__valor">{formatearMonto(disponible)}</span>
    </div>
  );
}
