import { useId } from 'react';
import { capitalizarPrimera, nombreMesDelAnio } from '../utils/fechas';
import { IconoChevronAbajo } from './Iconos';

interface Props {
  mes: Date;
  anios: number[];
  onCambiar: (mes: Date) => void;
}

interface PropsCampo {
  etiqueta: string;
  valor: number;
  opciones: { valor: number; texto: string }[];
  onCambiar: (valor: number) => void;
}

// Un desplegable nativo (teclado y lector de pantalla gratis) vestido de
// píldora de vidrio, con su etiqueta pequeña arriba como en el Excel.
function Campo({ etiqueta, valor, opciones, onCambiar }: PropsCampo) {
  const id = useId();
  return (
    <div className="relative">
      <label htmlFor={id} className="absolute top-1.5 left-4 text-[11px] text-secundario">
        {etiqueta}
      </label>
      <select
        id={id}
        value={valor}
        onChange={(e) => onCambiar(Number(e.target.value))}
        className="h-14 cursor-pointer appearance-none rounded-2xl bg-black/[0.05] pt-4 pr-10 pl-4 text-[16px] font-semibold transition-colors hover:bg-black/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/[0.08] dark:hover:bg-white/[0.12]"
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
      <IconoChevronAbajo className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-secundario" />
    </div>
  );
}

// Año y mes del tablero (el "Seleccione el periodo" del Excel).
export function SelectorPeriodo({ mes, anios, onCambiar }: Props) {
  return (
    <div className="flex gap-3" role="group" aria-label="Periodo del tablero">
      <Campo
        etiqueta="Año"
        valor={mes.getFullYear()}
        opciones={anios.map((a) => ({ valor: a, texto: String(a) }))}
        onCambiar={(anio) => onCambiar(new Date(anio, mes.getMonth(), 1))}
      />
      <Campo
        etiqueta="Mes"
        valor={mes.getMonth() + 1}
        opciones={Array.from({ length: 12 }, (_, i) => ({ valor: i + 1, texto: capitalizarPrimera(nombreMesDelAnio(i + 1)) }))}
        onCambiar={(m) => onCambiar(new Date(mes.getFullYear(), m - 1, 1))}
      />
    </div>
  );
}
