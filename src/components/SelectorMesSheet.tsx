import { useEffect, useMemo, useState } from 'react';
import { ALTURA_ITEM_RUEDA, ALTURA_RUEDA, RuedaSelector } from './RuedaSelector';
import './SelectorMesSheet.css';
import { useBloqueoDeFondo, useGestosSheet } from './useComportamientoSheet';

interface Props {
  abierto: boolean;
  mes: Date;
  onCerrar: () => void;
  onSeleccionar: (mes: Date) => void;
  // true cuando se abre encima de otro sheet ya abierto (ej. dentro de
  // HistorialFiltrosSheet), para que quede visualmente por delante sin
  // depender del orden en el DOM (mismo z-index que sheet-overlay--anidado).
  anidado?: boolean;
}

const RANGO_ANIOS_ATRAS = 10;
const RANGO_ANIOS_ADELANTE = 2;

function capitalizarPrimera(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const NOMBRES_MESES = Array.from({ length: 12 }, (_, i) =>
  capitalizarPrimera(new Date(2000, i, 1).toLocaleDateString('es-CO', { month: 'long' }))
);

export function SelectorMesSheet({ abierto, mes, onCerrar, onSeleccionar, anidado }: Props) {
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

  useBloqueoDeFondo(abierto);
  const gestos = useGestosSheet(abierto, onCerrar);

  // Si se reabre con un mes distinto al que quedó seleccionado la última vez
  // (ej. se usaron las flechas ‹ › de SelectorMes mientras tanto), resincroniza.
  useEffect(() => {
    if (!abierto) return;
    setIndiceMes(mes.getMonth());
    setIndiceAnio(Math.max(0, anios.indexOf(mes.getFullYear())));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al abrir
  }, [abierto]);

  if (!abierto) return null;

  function confirmar() {
    onSeleccionar(new Date(anios[indiceAnio], indiceMes, 1));
    onCerrar();
  }

  return (
    <div
      className={`sheet-overlay ${anidado ? 'sheet-overlay--anidado' : ''}`}
      onClick={onCerrar}
      style={gestos.overlayStyle}
    >
      <div
        className={`sheet ${gestos.arrastrando ? 'sheet--arrastrando' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={gestos.sheetStyle}
      >
        <div className="sheet__header">
          <div
            className="sheet__handle-area"
            onPointerDown={gestos.onPointerDownHandle}
            onPointerMove={gestos.onPointerMoveHandle}
            onPointerUp={gestos.onPointerUpHandle}
            onPointerCancel={gestos.onPointerUpHandle}
          >
            <div className="sheet__handle" />
          </div>
          <h2 className="sheet__titulo">Elegir mes</h2>
        </div>

        <div className="selector-mes-sheet__ruedas" style={{ height: ALTURA_RUEDA }}>
          <div
            className="selector-mes-sheet__banda"
            style={{ top: (ALTURA_RUEDA - ALTURA_ITEM_RUEDA) / 2, height: ALTURA_ITEM_RUEDA }}
            aria-hidden
          />
          <RuedaSelector
            opciones={NOMBRES_MESES}
            indice={indiceMes}
            onCambiar={setIndiceMes}
            className="selector-mes-sheet__rueda-mes"
          />
          <RuedaSelector
            opciones={anios.map(String)}
            indice={indiceAnio}
            onCambiar={setIndiceAnio}
            className="selector-mes-sheet__rueda-anio"
          />
        </div>

        <button className="btn-primario" onClick={confirmar}>
          Listo
        </button>
        <button className="btn-cancelar" onClick={onCerrar}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
