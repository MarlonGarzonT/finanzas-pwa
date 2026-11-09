import { Button } from 'konsta/react';
import { useEffect, useMemo, useState } from 'react';
import { capitalizarPrimera } from '../utils/fechas';
import { HojaInferior } from './HojaInferior';
import { ALTURA_ITEM_RUEDA, ALTURA_RUEDA, RuedaSelector } from './RuedaSelector';

interface Props {
  abierto: boolean;
  mes: Date;
  onCerrar: () => void;
  onSeleccionar: (mes: Date) => void;
}

const RANGO_ANIOS_ATRAS = 10;
const RANGO_ANIOS_ADELANTE = 2;

const NOMBRES_MESES = Array.from({ length: 12 }, (_, i) =>
  capitalizarPrimera(new Date(2000, i, 1).toLocaleDateString('es-CO', { month: 'long' }))
);

export function SelectorMesSheet({ abierto, mes, onCerrar, onSeleccionar }: Props) {
  const anioActual = new Date().getFullYear();
  const anios = useMemo(
    () =>
      Array.from(
        { length: RANGO_ANIOS_ATRAS + RANGO_ANIOS_ADELANTE + 1 },
        (_, i) => anioActual - RANGO_ANIOS_ATRAS + i
      ),
    [anioActual]
  );

  const [indiceMes, setIndiceMes] = useState(mes.getMonth());
  const [indiceAnio, setIndiceAnio] = useState(() => Math.max(0, anios.indexOf(mes.getFullYear())));

  // Si se reabre con un mes distinto al que quedó seleccionado la última vez
  // (ej. se usaron las flechas ‹ › de SelectorMes mientras tanto), resincroniza.
  useEffect(() => {
    if (!abierto) return;
    setIndiceMes(mes.getMonth());
    setIndiceAnio(Math.max(0, anios.indexOf(mes.getFullYear())));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al abrir
  }, [abierto]);

  function confirmar() {
    onSeleccionar(new Date(anios[indiceAnio], indiceMes, 1));
    onCerrar();
  }

  return (
    <HojaInferior
      abierto={abierto}
      titulo="Elegir mes"
      onCerrar={onCerrar}
      pie={
        <Button large rounded onClick={confirmar}>
          Listo
        </Button>
      }
    >
      {/* Las ruedas se montan solo con la hoja abierta: miden su scroll al
          montar, y así siempre arrancan en el mes vigente. */}
      {abierto && (
        <div className="relative mx-4 my-2 flex justify-center gap-1 px-2" style={{ height: ALTURA_RUEDA }}>
          <div
            className="pointer-events-none absolute inset-x-2 rounded-xl bg-black/[0.06] dark:bg-white/10"
            style={{ top: (ALTURA_RUEDA - ALTURA_ITEM_RUEDA) / 2, height: ALTURA_ITEM_RUEDA }}
            aria-hidden="true"
          />
          <RuedaSelector
            opciones={NOMBRES_MESES}
            indice={indiceMes}
            onCambiar={setIndiceMes}
            etiqueta="Mes"
            className="flex-[1.3]"
          />
          <RuedaSelector
            opciones={anios.map(String)}
            indice={indiceAnio}
            onCambiar={setIndiceAnio}
            etiqueta="Año"
            className="flex-1"
          />
        </div>
      )}
    </HojaInferior>
  );
}
