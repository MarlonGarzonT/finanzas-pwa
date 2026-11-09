import { useEffect, useState } from 'react';
import type { GastoSemanal } from '../utils/estadisticasMes';
import { formatearMonto, formatearMontoCompacto } from '../utils/fechas';

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
    return <p className="m-0 py-4 text-center text-[15px] text-secundario">Nada que mostrar en este mes todavía.</p>;
  }

  const max = Math.max(...datos.map((d) => d.monto));

  return (
    <ul className="m-0 flex h-36 list-none items-stretch gap-2.5 p-0" aria-label="Gasto por semana">
      {datos.map((d, i) => (
        <li key={d.semana} className="flex min-w-0 flex-1 flex-col items-center">
          <span className="sr-only">
            Semana {d.semana}: {formatearMonto(d.monto)}
          </span>
          <div className="flex w-full flex-1 items-end" aria-hidden="true">
            <div
              className="w-full rounded-t-lg rounded-b-[3px] bg-primary transition-[height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                height: montado ? `${Math.max(6, (d.monto / max) * 100)}%` : '0%',
                transitionDelay: `${i * 70}ms`,
              }}
            />
          </div>
          <span className="mt-1.5 text-xs font-semibold cifras" aria-hidden="true">
            {formatearMontoCompacto(d.monto)}
          </span>
          <span className="text-xs text-secundario" aria-hidden="true">
            S{d.semana}
          </span>
        </li>
      ))}
    </ul>
  );
}
