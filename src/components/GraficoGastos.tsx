import { emojiCategoria } from '../utils/emojiCategoria';
import { formatearMontoCompacto } from '../utils/fechas';
import './Graficos.css';

interface Fila {
  categoria: string;
  monto: number;
}

export function GraficoGastos({ datos }: { datos: Fila[] }) {
  if (datos.length === 0) {
    return (
      <div className="grafico-card">
        <h3 className="grafico-card__titulo">Gastos del mes por categoría</h3>
        <p className="grafico-card__vacio">Aún no registras gastos este mes.</p>
      </div>
    );
  }

  const max = Math.max(...datos.map((d) => d.monto));

  return (
    <div className="grafico-card">
      <h3 className="grafico-card__titulo">Gastos del mes por categoría</h3>
      <div className="gastos-barras">
        {datos.map((d) => (
          <div key={d.categoria} className="gastos-barras__col">
            <div className="gastos-barras__pista">
              <div className="gastos-barras__barra" style={{ height: `${Math.max(6, (d.monto / max) * 100)}%` }} />
            </div>
            <span className="gastos-barras__emoji" aria-hidden>
              {emojiCategoria(d.categoria)}
            </span>
            <span className="gastos-barras__monto">{formatearMontoCompacto(d.monto)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
