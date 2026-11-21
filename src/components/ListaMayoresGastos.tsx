import { colorCategoria } from '../utils/colorCategoria';
import { formatearFechaCorta, formatearMonto } from '../utils/fechas';
import type { GastoGrande } from '../utils/tablero';
import { Aviso } from './Segmentos';

interface Props {
  gastos: GastoGrande[];
}

// Los cinco gastos individuales más grandes del mes: la tabla por categoría
// dice dónde se fue la plata; esto dice en qué compras concretas.
export function ListaMayoresGastos({ gastos }: Props) {
  if (gastos.length === 0) return <Aviso>No hay gastos en este periodo.</Aviso>;
  const mayor = gastos[0].monto;
  return (
    <ol className="m-0 flex list-none flex-col p-0">
      {gastos.map((g, indice) => (
        <li key={g.id} className="flex items-center gap-3 border-t border-black/[0.06] py-2.5 first:border-t-0 dark:border-white/10">
          <span className="w-4 text-center text-[13px] font-semibold text-secundario cifras">{indice + 1}</span>
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-[18px]"
            style={{ background: `color-mix(in srgb, ${colorCategoria(g.nombre)} 24%, transparent)` }}
            aria-hidden="true"
          >
            {g.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-[15px] font-medium">{g.item}</p>
            <p className="m-0 truncate text-[13px] text-secundario">
              {g.nombre} · {formatearFechaCorta(g.fecha)}
            </p>
          </div>
          <div className="w-28 shrink-0 text-right">
            <p className="m-0 text-[15px] font-semibold cifras">{formatearMonto(g.monto)}</p>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/10" aria-hidden="true">
              <div className="barra-progreso h-full origin-left rounded-full bg-[#ff7080]" style={{ transform: `scaleX(${mayor > 0 ? g.monto / mayor : 0})` }} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
