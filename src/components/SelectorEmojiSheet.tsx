import { useRef, useState } from 'react';
import { buscarEmojis, GRUPOS_EMOJIS, type EmojiInfo } from '../data/emojis';
import './NuevoMovimientoSheet.css';
import './SelectorEmojiSheet.css';
import { useBloqueoDeFondo, useGestosSheet } from './useComportamientoSheet';

interface Props {
  abierto: boolean;
  seleccionado: string;
  onCerrar: () => void;
  onSeleccionar: (emoji: string) => void;
  // true cuando se abre encima de otro sheet ya abierto (ej. dentro de
  // GestionCategorias), para quedar visualmente por delante.
  anidado?: boolean;
}

export function SelectorEmojiSheet({ abierto, seleccionado, onCerrar, onSeleccionar, anidado }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const gruposRef = useRef<Record<string, HTMLElement | null>>({});

  useBloqueoDeFondo(abierto);
  const gestos = useGestosSheet(abierto, onCerrar);

  if (!abierto) return null;

  function elegir(emoji: string) {
    onSeleccionar(emoji);
    onCerrar();
  }

  function irAGrupo(slug: string) {
    gruposRef.current[slug]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const resultados = busqueda.trim() ? buscarEmojis(busqueda) : null;

  return (
    <div
      className={`sheet-overlay ${anidado ? 'sheet-overlay--anidado' : ''}`}
      onClick={onCerrar}
      style={gestos.overlayStyle}
    >
      <div
        className={`sheet selector-emoji-sheet ${gestos.arrastrando ? 'sheet--arrastrando' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onFocusCapture={gestos.onFocusCaptureSheet}
        style={gestos.sheetStyle}
      >
        <div className="selector-emoji-sheet__fijo">
          <div
            className="sheet__handle-area"
            onPointerDown={gestos.onPointerDownHandle}
            onPointerMove={gestos.onPointerMoveHandle}
            onPointerUp={gestos.onPointerUpHandle}
            onPointerCancel={gestos.onPointerUpHandle}
          >
            <div className="sheet__handle" />
          </div>
          <h2 className="sheet__titulo">Elegir emoji</h2>

          <input
            className="texto-input"
            type="search"
            placeholder="Buscar emoji"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          {!resultados && (
            <div className="selector-emoji-sheet__tabs">
              {GRUPOS_EMOJIS.map((g) => (
                <button
                  key={g.slug}
                  type="button"
                  className="selector-emoji-sheet__tab"
                  onClick={() => irAGrupo(g.slug)}
                  aria-label={g.etiqueta}
                  title={g.etiqueta}
                >
                  {g.icono}
                </button>
              ))}
            </div>
          )}
        </div>

        {resultados ? (
          resultados.length === 0 ? (
            <p className="selector-emoji-sheet__vacio">Ningún emoji coincide con "{busqueda}".</p>
          ) : (
            <div className="selector-emoji-sheet__grilla">
              {resultados.map((e) => (
                <BotonEmoji key={e.slug} info={e} activo={e.emoji === seleccionado} onClick={() => elegir(e.emoji)} />
              ))}
            </div>
          )
        ) : (
          GRUPOS_EMOJIS.map((g) => (
            <section
              key={g.slug}
              className="selector-emoji-sheet__grupo"
              ref={(el) => {
                gruposRef.current[g.slug] = el;
              }}
            >
              <h3>{g.etiqueta}</h3>
              <div className="selector-emoji-sheet__grilla">
                {g.emojis.map((e) => (
                  <BotonEmoji key={e.slug} info={e} activo={e.emoji === seleccionado} onClick={() => elegir(e.emoji)} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function BotonEmoji({ info, activo, onClick }: { info: EmojiInfo; activo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`selector-emoji-sheet__opcion ${activo ? 'selector-emoji-sheet__opcion--activa' : ''}`}
      onClick={onClick}
      aria-label={info.name}
      title={info.name}
    >
      {info.emoji}
    </button>
  );
}
