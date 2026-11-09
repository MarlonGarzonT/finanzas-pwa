import { useEffect, useState } from 'react';
import { useContarHasta } from './useContarHasta';

const RADIO = 52;
const GROSOR = 12;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;
const TAMANO = (RADIO + GROSOR) * 2;

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
  const color = tasa >= 0 ? 'var(--color-ingreso-relleno)' : 'var(--color-alerta-relleno)';

  return (
    <div className="relative flex items-center justify-center" role="img" aria-label={`Ahorraste el ${Math.round(tasa)}% de tus ingresos`}>
      <svg width={TAMANO} height={TAMANO} viewBox={`0 0 ${TAMANO} ${TAMANO}`} className="max-w-full" aria-hidden="true">
        <circle cx={TAMANO / 2} cy={TAMANO / 2} r={RADIO} fill="none" stroke="var(--color-pista)" strokeWidth={GROSOR} />
        <circle
          cx={TAMANO / 2}
          cy={TAMANO / 2}
          r={RADIO}
          fill="none"
          stroke={color}
          strokeWidth={GROSOR}
          strokeLinecap="round"
          strokeDasharray={CIRCUNFERENCIA}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${TAMANO / 2} ${TAMANO / 2})`}
          className="transition-[stroke-dashoffset] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <span className="text-[28px] leading-none font-bold tracking-tight cifras">{Math.round(numero)}%</span>
        <span className="mt-1 text-[13px] text-secundario">Ahorro</span>
      </div>
    </div>
  );
}
