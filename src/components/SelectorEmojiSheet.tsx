import { Searchbar } from 'konsta/react';
import { useRef, useState } from 'react';
import { buscarEmojis, GRUPOS_EMOJIS, type EmojiInfo } from '../data/emojis';
import { HojaInferior } from './HojaInferior';

interface Props {
  abierto: boolean;
  seleccionado: string;
  onCerrar: () => void;
  onSeleccionar: (emoji: string) => void;
}

export function SelectorEmojiSheet({ abierto, seleccionado, onCerrar, onSeleccionar }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const gruposRef = useRef<Record<string, HTMLElement | null>>({});

  function elegir(emoji: string) {
    onSeleccionar(emoji);
    onCerrar();
  }

  function irAGrupo(slug: string) {
    gruposRef.current[slug]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const resultados = busqueda.trim() ? buscarEmojis(busqueda) : null;

  return (
    <HojaInferior
      abierto={abierto}
      titulo="Elegir emoji"
      onCerrar={onCerrar}
      cabecera={
        <div className="flex flex-col gap-2 pb-2">
          <Searchbar
            value={busqueda}
            placeholder="Buscar emoji (en inglés)"
            onInput={(e: React.ChangeEvent<HTMLInputElement>) => setBusqueda(e.target.value)}
            onClear={() => setBusqueda('')}
            clearButton
            disableButton={false}
          />
          {!resultados && (
            <div className="flex gap-1 overflow-x-auto px-4 [scrollbar-width:none]" role="toolbar" aria-label="Ir a grupo">
              {GRUPOS_EMOJIS.map((g) => (
                <button
                  key={g.slug}
                  type="button"
                  className="flex size-11 shrink-0 items-center justify-center rounded-full text-xl active:bg-black/10 dark:active:bg-white/15"
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
      }
    >
      <div className="pie-seguro px-3">
        {resultados ? (
          resultados.length === 0 ? (
            <p className="py-10 text-center text-[15px] text-secundario">Ningún emoji coincide con “{busqueda}”.</p>
          ) : (
            <GrillaEmojis emojis={resultados} seleccionado={seleccionado} onElegir={elegir} />
          )
        ) : (
          GRUPOS_EMOJIS.map((g) => (
            <section
              key={g.slug}
              className="scroll-mt-40"
              ref={(el) => {
                gruposRef.current[g.slug] = el;
              }}
            >
              <h3 className="mx-1 mt-3 mb-2 text-[13px] font-semibold text-secundario uppercase">{g.etiqueta}</h3>
              <GrillaEmojis emojis={g.emojis} seleccionado={seleccionado} onElegir={elegir} />
            </section>
          ))
        )}
      </div>
    </HojaInferior>
  );
}

function GrillaEmojis({
  emojis,
  seleccionado,
  onElegir,
}: {
  emojis: EmojiInfo[];
  seleccionado: string;
  onElegir: (emoji: string) => void;
}) {
  // Botones planos a propósito: son hasta ~1900 celdas en el DOM y cualquier
  // efecto por celda (blur, sombra) sería carísimo en un teléfono de gama media.
  return (
    <div className="grid grid-cols-8 gap-1">
      {emojis.map((e) => (
        <button
          key={e.slug}
          type="button"
          className={`flex aspect-square items-center justify-center rounded-xl text-2xl leading-none active:scale-90 ${
            e.emoji === seleccionado ? 'bg-primary/15 ring-2 ring-primary ring-inset' : 'active:bg-black/10 dark:active:bg-white/15'
          }`}
          onClick={() => onElegir(e.emoji)}
          aria-label={e.name}
          aria-pressed={e.emoji === seleccionado}
        >
          {e.emoji}
        </button>
      ))}
    </div>
  );
}
