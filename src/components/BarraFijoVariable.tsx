import { useEffect, useState } from 'react';
import type { FijoVariable } from '../utils/estadisticasMes';
import { formatearMonto } from '../utils/fechas';
import { IconoFijo } from './Iconos';

export function BarraFijoVariable({ fijo, variable, porcentajeFijo }: FijoVariable) {
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (fijo + variable === 0) {
    return <p className="m-0 py-4 text-center text-[15px] text-secundario">Nada que mostrar en este mes todavía.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="h-3.5 overflow-hidden rounded-full bg-[var(--categoria-menta)]"
        role="img"
        aria-label={`${Math.round(porcentajeFijo)}% de tu gasto es fijo`}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: montado ? `${porcentajeFijo}%` : '0%' }}
        />
      </div>
      <div className="flex flex-wrap justify-between gap-2 text-[15px]">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-primary" aria-hidden="true" />
          <IconoFijo className="size-4 text-secundario" />
          Fijo <span className="font-semibold cifras">{formatearMonto(fijo)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[var(--categoria-menta)]" aria-hidden="true" />
          Variable <span className="font-semibold cifras">{formatearMonto(variable)}</span>
        </span>
      </div>
    </div>
  );
}
