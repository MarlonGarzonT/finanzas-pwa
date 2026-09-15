import { useEffect, useRef } from 'react';
import './RuedaSelector.css';

export const ALTURA_ITEM_RUEDA = 40;
export const ITEMS_VISIBLES_RUEDA = 5;
export const ALTURA_RUEDA = ALTURA_ITEM_RUEDA * ITEMS_VISIBLES_RUEDA;
const PADDING_VERTICAL = (ALTURA_RUEDA - ALTURA_ITEM_RUEDA) / 2;

interface Props {
  opciones: string[];
  indice: number;
  onCambiar: (indice: number) => void;
  className?: string;
}

// Selector tipo "rueda" de iOS (UIPickerView): scroll con snap + momentum
// nativo del navegador, más un difuminado continuo (opacidad/escala) que
// sigue el scroll en vivo, no solo al asentarse - eso es lo que le da la
// sensación de rueda física en vez de una simple lista con resaltado.
export function RuedaSelector({ opciones, indice, onCambiar, className }: Props) {
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
      const opacidad = Math.max(0.22, 1 - distancia * 0.4);
      const escala = Math.max(0.72, 1 - distancia * 0.14);
      el.style.opacity = String(opacidad);
      el.style.transform = `scale(${escala})`;
    });
  }

  function manejarScroll(e: React.UIEvent<HTMLDivElement>) {
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

  function manejarClickItem(i: number) {
    contenedorRef.current?.scrollTo({ top: i * ALTURA_ITEM_RUEDA, behavior: 'smooth' });
  }

  return (
    <div className={`rueda-selector ${className ?? ''}`} ref={contenedorRef} onScroll={manejarScroll}>
      <div style={{ height: PADDING_VERTICAL }} aria-hidden />
      {opciones.map((op, i) => (
        <div
          key={op}
          ref={(el) => {
            itemsRef.current[i] = el;
          }}
          className="rueda-selector__item"
          onClick={() => manejarClickItem(i)}
        >
          {op}
        </div>
      ))}
      <div style={{ height: PADDING_VERTICAL }} aria-hidden />
    </div>
  );
}
