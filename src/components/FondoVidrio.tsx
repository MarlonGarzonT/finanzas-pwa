import { useEffect, useRef, useState } from 'react';
import { soportaWebgl2 } from '../utils/soportaWebgl2';
import Aurora from './reactbits/Aurora';

// Azul pizarra, verde menta y verde profundo: la paleta de la tarjeta de la
// brecha (tomada de la referencia del usuario).
const COLORES = ['#4a6bb5', '#1f9d6c', '#14452f'];

// Respaldo sin WebGL: los mismos tres colores en manchas quietas.
const RESPALDO =
  'radial-gradient(60% 50% at 18% 12%, rgb(74 107 181 / 0.7), transparent 70%), radial-gradient(55% 55% at 88% 30%, rgb(31 157 108 / 0.55), transparent 70%), radial-gradient(70% 45% at 50% 100%, rgb(33 123 86 / 0.7), transparent 70%)';

// Fondo vivo detrás de una tarjeta de vidrio: manchas de color que se mueven
// despacio (Aurora de React Bits) sobre un azul muy oscuro. Decorativo: oculto
// al lector de pantalla, quieto con "reducir movimiento".
export function FondoVidrio() {
  const [conAurora, setConAurora] = useState(soportaWebgl2);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const contenedor = ref.current;
    if (!contenedor || !conAurora) return;
    const alPerderse = () => setConAurora(false);
    contenedor.addEventListener('webglcontextlost', alPerderse, true);
    return () => contenedor.removeEventListener('webglcontextlost', alPerderse, true);
  }, [conAurora]);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 bg-[#0a1522]"
      style={conAurora ? undefined : { backgroundImage: RESPALDO }}
      aria-hidden="true"
    >
      {conAurora && (
        <div className="absolute inset-0 scale-125 blur-xl">
          <Aurora colorStops={COLORES} amplitude={1.2} blend={0.9} height={0.95} glow={0.8} brightness={0.8} speed={0.45} layers={3} mouseInteraction={false} dpr={1} />
        </div>
      )}
    </div>
  );
}
