import { colorCategoria } from '../utils/colorCategoria';
import { formatearMonto } from '../utils/fechas';
import type { FilaCategoria, TablaCategorias } from '../utils/tablero';
import { IconoTendencia } from './Iconos';
import { Aviso } from './Segmentos';

interface Props {
  tabla: TablaCategorias;
  // En un gasto, que suba es lo malo; en un ingreso, lo bueno.
  subirEsBueno: boolean;
  vacio: string;
}

// Una variación vale como "bien" o "mal" según de qué tabla venga. La flecha y
// el signo acompañan siempre al color.
function Variacion({ valor, subirEsBueno }: { valor: number | null; subirEsBueno: boolean }) {
  if (valor === null) return <span className="text-secundario">—</span>;
  const redondeado = Math.round(valor);
  if (redondeado === 0) return <span className="text-secundario cifras">0 %</span>;
  const sube = redondeado > 0;
  const bien = sube === subirEsBueno;
  return (
    <span className={`inline-flex items-center justify-end gap-1 font-semibold cifras ${bien ? 'text-ingreso' : 'text-alerta'}`}>
      <IconoTendencia sube={sube} className="size-4" />
      {sube ? '+' : '−'}
      {Math.abs(redondeado)} %
    </span>
  );
}

function Fila({ fila, subirEsBueno }: { fila: FilaCategoria; subirEsBueno: boolean }) {
  return (
    <tr className="border-t border-black/[0.06] dark:border-white/10">
      <th scope="row" className="py-1.5 pr-2 text-left font-medium">
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[16px]"
            style={{ background: `color-mix(in srgb, ${colorCategoria(fila.id)} 24%, transparent)` }}
            aria-hidden="true"
          >
            {fila.emoji}
          </span>
          <span className="truncate">{fila.nombre}</span>
        </span>
      </th>
      <td className="px-1.5 py-1.5 text-right text-[14px] text-secundario cifras">{fila.promedio === null ? '—' : formatearMonto(Math.round(fila.promedio))}</td>
      <td className="px-1.5 py-1.5 text-right text-[14px] font-semibold cifras">{formatearMonto(fila.total)}</td>
      <td className="py-1.5 pl-1.5 text-right text-[13px] whitespace-nowrap">
        <Variacion valor={fila.variacion} subirEsBueno={subirEsBueno} />
      </td>
    </tr>
  );
}

// Categoría, promedio de los meses anteriores, total del mes y cuánto se
// aparta del promedio. Es el corazón del tablero: de un vistazo se ve qué
// categoría se disparó o se calmó. Con más de ocho filas la tabla se desplaza
// por dentro; el encabezado y el total quedan a la vista.
export function TablaCategoriasTablero({ tabla, subirEsBueno, vacio }: Props) {
  if (tabla.filas.length === 0) return <Aviso>{vacio}</Aviso>;
  return (
    <div>
      <table className="w-full border-collapse text-[15px]">
        <thead>
          <tr className="text-[12px] text-secundario">
            <th scope="col" className="pb-2 text-left font-medium">
              Categoría
            </th>
            <th scope="col" className="px-1.5 pb-2 text-right font-medium">
              Promedio
            </th>
            <th scope="col" className="px-1.5 pb-2 text-right font-medium">
              Este mes
            </th>
            <th scope="col" className="pb-2 pl-1.5 text-right font-medium">
              Variación
            </th>
          </tr>
        </thead>
        <tbody>
          {tabla.filas.map((fila) => (
            <Fila key={fila.id} fila={fila} subirEsBueno={subirEsBueno} />
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black/10 font-bold dark:border-white/15">
            <th scope="row" className="py-2.5 pr-3 text-left">
              Total
            </th>
            <td className="px-1.5 py-2.5 text-right text-[14px] text-secundario cifras">{tabla.promedio === null ? '—' : formatearMonto(Math.round(tabla.promedio))}</td>
            <td className="px-1.5 py-2.5 text-right text-[14px] cifras">{formatearMonto(tabla.total)}</td>
            <td className="py-2.5 pl-1.5 text-right text-[13px] whitespace-nowrap">
              <Variacion valor={tabla.variacion} subirEsBueno={subirEsBueno} />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
