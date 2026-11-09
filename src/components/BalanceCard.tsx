import type { Tipo } from '../types';
import { formatearMonto } from '../utils/fechas';
import { LineaApartes } from './LineaApartes';
import { OpcionSelector, SelectorVidrio } from './SelectorVidrio';

interface Props {
  disponible: number;
  totalIngresos: number;
  totalEgresos: number;
  // Plata que movió el Disponible sin ser gasto ni ingreso.
  ahorro: number;
  prestado: number;
  devuelto: number;
  filtro: Tipo;
  onFiltroChange: (filtro: Tipo) => void;
}

const SEGMENTOS: { tipo: Tipo; etiqueta: string }[] = [
  { tipo: 'egreso', etiqueta: 'Gastos' },
  { tipo: 'ingreso', etiqueta: 'Ingresos' },
];

export function BalanceCard({
  disponible,
  totalIngresos,
  totalEgresos,
  ahorro,
  prestado,
  devuelto,
  filtro,
  onFiltroChange,
}: Props) {
  const negativo = disponible < 0;
  const totales: Record<Tipo, number> = { egreso: totalEgresos, ingreso: totalIngresos };

  return (
    <section className="flex flex-col gap-5 px-4 pt-1 pb-2" aria-label="Disponible del mes">
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[15px] font-medium text-secundario">Disponible</span>
        {/* Positivo va sin signo, como cualquier saldo; un negativo sí es una
            alerta (se gastó más de lo que entró) y lleva signo y color. */}
        <p
          className={`m-0 text-[48px] leading-[1.1] font-bold tracking-[-0.03em] cifras ${negativo ? 'text-alerta' : ''}`}
        >
          {negativo && <span className="sr-only">Negativo: </span>}
          {negativo && <span aria-hidden="true">−</span>}
          {formatearMonto(Math.abs(disponible))}
        </p>
        <LineaApartes ahorro={ahorro} prestado={prestado} devuelto={devuelto} className="mt-1 text-center" />
      </div>

      {/* Define qué muestra el gráfico de abajo. */}
      <SelectorVidrio className="mx-auto w-full max-w-96">
        {SEGMENTOS.map((s) => (
          <OpcionSelector
            key={s.tipo}
            active={filtro === s.tipo}
            onClick={() => onFiltroChange(s.tipo)}
            className="h-14 flex-col gap-0 normal-case"
          >
            <span className="text-xs font-medium text-secundario">{s.etiqueta}</span>
            <span
              className={`text-[17px] font-semibold tracking-tight cifras ${s.tipo === 'ingreso' ? 'text-ingreso' : 'text-black dark:text-white'}`}
            >
              {formatearMonto(totales[s.tipo])}
            </span>
          </OpcionSelector>
        ))}
      </SelectorVidrio>
    </section>
  );
}
