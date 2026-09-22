import { useEffect, useState } from 'react';
import type { GastoSemanal } from '../utils/estadisticasMes';
import { formatearMontoCompacto } from '../utils/fechas';
import './GraficoSemanal.css';

interface Props {
  datos: GastoSemanal[];
}

export function GraficoSemanal({ datos }: Props) {
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (datos.length === 0) {
    return <p className="grafico-card__vacio">Nada que mostrar todavía.</p>;
  }

  const max = Math.max(...datos.map((d) => d.monto));

  return (
    <div className="grafico-semanal">
      {datos.map((d, i) => (
        <div key={d.semana} className="grafico-semanal__col">
          <div className="grafico-semanal__pista">
            <div
              className="grafico-semanal__barra"
              style={{
                height: montado ? `${Math.max(6, (d.monto / max) * 100)}%` : '0%',
                transitionDelay: `${i * 70}ms`,
              }}
            />
          </div>
          <span className="grafico-semanal__monto">{formatearMontoCompacto(d.monto)}</span>
          <span className="grafico-semanal__etiqueta">S{d.semana}</span>
        </div>
      ))}
    </div>
  );
}
