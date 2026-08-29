import { formatearMonto } from '../utils/fechas';
import './BalanceCard.css';

export function BalanceCard({ disponible }: { disponible: number }) {
  const negativo = disponible < 0;
  return (
    <div className="balance-card">
      <span className="balance-card__label">Disponible</span>
      <span className={`balance-card__valor ${negativo ? 'balance-card__valor--negativo' : ''}`}>
        {formatearMonto(disponible)}
      </span>
    </div>
  );
}
