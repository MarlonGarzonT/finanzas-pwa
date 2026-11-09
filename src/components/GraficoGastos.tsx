import { useEffect, useState } from 'react';
import { colorCategoria } from '../utils/colorCategoria';
import { formatearMonto, formatearMontoCompacto } from '../utils/fechas';

interface Fila {
  categoriaId: string;
  categoria: string;
  emoji: string;
  monto: number;
}

interface Props {
  datos: Fila[];
  mensajeVacio?: string;
}

// Cada barra lleva el color de su categoría (el mismo del avatar en las
// listas y del arco en la dona), no verde/rojo: el gráfico compara
// categorías entre sí, y el tipo ya lo dice el control de arriba.
export function GraficoGastos({ datos, mensajeVacio = 'Aún no registras gastos este mes.' }: Props) {
  // Las barras arrancan en 0 y crecen a su alto real tras montar, para que
  // el gráfico "aparezca" animado en vez de dibujarse ya completo.
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (datos.length === 0) {
    return <p className="m-0 py-6 text-center text-[15px] text-secundario">{mensajeVacio}</p>;
  }

  const max = Math.max(...datos.map((d) => d.monto));

  return (
    <ul className="m-0 flex h-44 list-none items-stretch gap-2.5 p-0" aria-label="Montos por categoría">
      {datos.map((d) => (
        <li key={d.categoriaId} className="flex min-w-0 flex-1 flex-col items-center">
          <span className="sr-only">
            {d.categoria}: {formatearMonto(d.monto)}
          </span>
          <div className="flex w-full flex-1 items-end" aria-hidden="true">
            <div
              className="w-full origin-bottom rounded-t-[10px] rounded-b-[4px] transition-[height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                height: montado ? `${Math.max(6, (d.monto / max) * 100)}%` : '0%',
                background: colorCategoria(d.categoriaId),
              }}
            />
          </div>
          <span className="mt-2 text-xl leading-none" aria-hidden="true">
            {d.emoji}
          </span>
          <span className="mt-1 text-xs font-semibold text-secundario cifras" aria-hidden="true">
            {formatearMontoCompacto(d.monto)}
          </span>
        </li>
      ))}
    </ul>
  );
}
