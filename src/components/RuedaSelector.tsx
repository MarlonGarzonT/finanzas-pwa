import { useEffect, useRef, type KeyboardEvent, type UIEvent } from 'react';

export const ALTURA_ITEM_RUEDA = 40;
export const ITEMS_VISIBLES_RUEDA = 5;
export const ALTURA_RUEDA = ALTURA_ITEM_RUEDA * ITEMS_VISIBLES_RUEDA;
const PADDING_VERTICAL = (ALTURA_RUEDA - ALTURA_ITEM_RUEDA) / 2;

interface Props {
  opciones: string[];
  indice: number;
  onCambiar: (indice: number) => void;
  etiqueta: string;
  className?: string;
}

// Selector tipo "rueda" de iOS (UIPickerView): scroll con snap + momentum
// nativo del navegador, más un difuminado continuo (opacidad/escala) que
// sigue el scroll en vivo, no solo al asentarse - eso es lo que le da la
// sensación de rueda física en vez de una simple lista con resaltado.
// Konsta no trae un picker de rueda, así que este se mantiene propio.
export function RuedaSelector({ opciones, indice, onCambiar, etiqueta, className = '' }: Props) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (contenedorRef.current) contenedorRef.current.scrollTop = indice * ALTURA_ITEM_RUEDA;
    aplicarEstilosEnVivo(indice * ALTURA_ITEM_RUEDA);
    return () => window.clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar, no en cada cambio de indice
  }, []);

  function aplicarEstilosEnVivo(scrollTop: number) {
    const centro = scrollTop / ALTURA_ITEM_RUEDA;
    itemsRef.current.forEach((el, i) => {
      if (!el) return;
      const distancia = Math.abs(i - centro);
      el.style.opacity = String(Math.max(0.22, 1 - distancia * 0.4));
      el.style.transform = `scale(${Math.max(0.72, 1 - distancia * 0.14)})`;
    });
  }

  function manejarScroll(e: UIEvent<HTMLDivElement>) {
    const scrollTop = e.currentTarget.scrollTop;
    aplicarEstilosEnVivo(scrollTop);

    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      const i = Math.max(0, Math.min(opciones.length - 1, Math.round(scrollTop / ALTURA_ITEM_RUEDA)));
      contenedorRef.current?.scrollTo({ top: i * ALTURA_ITEM_RUEDA, behavior: 'smooth' });
      aplicarEstilosEnVivo(i * ALTURA_ITEM_RUEDA);
      if (i !== indice) onCambiar(i);
    }, 120);
  }

  function irA(i: number) {
    const destino = Math.max(0, Math.min(opciones.length - 1, i));
    contenedorRef.current?.scrollTo({ top: destino * ALTURA_ITEM_RUEDA, behavior: 'smooth' });
  }

  function manejarTecla(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      irA(indice + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      irA(indice - 1);
    }
  }

  return (
    <div
      ref={contenedorRef}
      onScroll={manejarScroll}
      onKeyDown={manejarTecla}
      tabIndex={0}
      role="listbox"
      aria-label={etiqueta}
      aria-activedescendant={`${etiqueta}-${indice}`}
      className={`relative z-[1] h-[200px] snap-y snap-mandatory overflow-y-scroll rounded-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      <div style={{ height: PADDING_VERTICAL }} aria-hidden="true" />
      {opciones.map((op, i) => (
        <div
          key={op}
          id={`${etiqueta}-${i}`}
          role="option"
          aria-selected={i === indice}
          ref={(el) => {
            itemsRef.current[i] = el;
          }}
          className="flex h-10 cursor-pointer snap-center items-center justify-center text-xl font-semibold tabular-nums select-none"
          onClick={() => irA(i)}
        >
          {op}
        </div>
      ))}
      <div style={{ height: PADDING_VERTICAL }} aria-hidden="true" />
    </div>
  );
}
