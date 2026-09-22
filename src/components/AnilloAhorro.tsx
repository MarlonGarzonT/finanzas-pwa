import { useEffect, useState } from 'react';
import { useContarHasta } from './useContarHasta';
import './AnilloAhorro.css';

const RADIO = 62;
const GROSOR = 14;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

interface Props {
  tasa: number; // porcentaje, puede ser negativo
}

export function AnilloAhorro({ tasa }: Props) {
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const tasaClamp = Math.max(0, Math.min(100, tasa));
  const numero = useContarHasta(montado ? tasa : 0);
  const offset = CIRCUNFERENCIA * (1 - (montado ? tasaClamp : 0) / 100);
  const color = tasa >= 0 ? 'var(--income)' : 'var(--expense)';

  return (
    <div className="anillo-ahorro">
      <svg width={(RADIO + GROSOR) * 2} height={(RADIO + GROSOR) * 2} viewBox={`0 0 ${(RADIO + GROSOR) * 2} ${(RADIO + GROSOR) * 2}`}>
        <circle
          cx={RADIO + GROSOR}
          cy={RADIO + GROSOR}
          r={RADIO}
          fill="none"
          stroke="var(--surface-tertiary)"
          strokeWidth={GROSOR}
        />
        <circle
          cx={RADIO + GROSOR}
          cy={RADIO + GROSOR}
          r={RADIO}
          fill="none"
          stroke={color}
          strokeWidth={GROSOR}
          strokeLinecap="round"
          strokeDasharray={CIRCUNFERENCIA}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${RADIO + GROSOR} ${RADIO + GROSOR})`}
          className="anillo-ahorro__trazo"
        />
      </svg>
      <div className="anillo-ahorro__centro">
        <span className="anillo-ahorro__numero">{Math.round(numero)}%</span>
        <span className="anillo-ahorro__etiqueta">Ahorro</span>
      </div>
    </div>
  );
}
