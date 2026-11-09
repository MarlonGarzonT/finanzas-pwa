import { Button } from 'konsta/react';
import { useState } from 'react';
import { capitalizarPrimera, nombreMes, sumarMeses } from '../utils/fechas';
import { IconoChevronAbajo, IconoChevronDerecha, IconoChevronIzquierda } from './Iconos';
import { SelectorMesSheet } from './SelectorMesSheet';

interface Props {
  mes: Date;
  onCambiar: (mes: Date) => void;
}

// Navegación de mes discreta: es contexto, no la acción principal, así que
// va en texto y no compite con el monto de abajo.
export function SelectorMes({ mes, onCambiar }: Props) {
  const [ruedaAbierta, setRuedaAbierta] = useState(false);
  const etiqueta = capitalizarPrimera(nombreMes(mes));

  return (
    <div className="flex items-center justify-between px-2">
      <Button
        clear
        rounded
        inline
        className="size-11 p-0 text-black/50 dark:text-white/55"
        onClick={() => onCambiar(sumarMeses(mes, -1))}
        aria-label="Mes anterior"
      >
        <IconoChevronIzquierda className="size-5" />
      </Button>
      <Button
        clear
        rounded
        inline
        className="h-11 gap-1 px-3 text-[17px] font-semibold normal-case text-black dark:text-white"
        onClick={() => setRuedaAbierta(true)}
        aria-label={`${etiqueta}. Elegir otro mes`}
      >
        {etiqueta}
        <IconoChevronAbajo className="size-4 text-black/45 dark:text-white/50" />
      </Button>
      <Button
        clear
        rounded
        inline
        className="size-11 p-0 text-black/50 dark:text-white/55"
        onClick={() => onCambiar(sumarMeses(mes, 1))}
        aria-label="Mes siguiente"
      >
        <IconoChevronDerecha className="size-5" />
      </Button>

      <SelectorMesSheet
        abierto={ruedaAbierta}
        mes={mes}
        onCerrar={() => setRuedaAbierta(false)}
        onSeleccionar={onCambiar}
      />
    </div>
  );
}
