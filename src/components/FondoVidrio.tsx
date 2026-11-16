import { useEffect, useRef, useState } from 'react';
import { soportaWebgl2 } from '../utils/soportaWebgl2';
import Aurora from './reactbits/Aurora';

// Azul pizarra, verde menta y verde profundo: la paleta de la tarjeta de la
// brecha (tomada de la referencia del usuario).
const COLORES = ['#4a6bb5', '#1f9d6c', '#14452f'];

// Respaldo sin movimiento: los mismos tres colores en manchas quietas.
const RESPALDO =
  'radial-gradient(60% 50% at 18% 12%, rgb(74 107 181 / 0.7), transparent 70%), radial-gradient(55% 55% at 88% 30%, rgb(31 157 108 / 0.55), transparent 70%), radial-gradient(70% 45% at 50% 100%, rgb(20 69 47 / 0.7), transparent 70%)';

// Por debajo de estos cuadros por segundo el fondo se queda quieto: un
// teléfono que no mueve esto con fluidez va mejor con el degradado fijo.
const FPS_MINIMO = 40;
const ESPERA_MEDICION_MS = 700; // el shader tarda en compilar
const DURACION_MEDICION_MS = 1200;

function puedeAnimar(): boolean {
  const conexion = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return soportaWebgl2() && !conexion?.saveData;
}

// Fondo vivo detrás de una tarjeta de vidrio: manchas de color que se mueven
// despacio (Aurora de React Bits) sobre un azul muy oscuro. Pensado para
// equipos modestos: se dibuja a poco más de la mitad de resolución (ya es
// difuso), a 30 cuadros por segundo y con 2 capas. Mide su propia fluidez al
// arrancar y, si no llega, se queda quieto; también se queda quieto sin
// WebGL2, con ahorro de datos y con "reducir movimiento". Decorativo: oculto
// al lector de pantalla.
export function FondoVidrio() {
  const [conAurora, setConAurora] = useState(puedeAnimar);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const contenedor = ref.current;
    if (!contenedor || !conAurora) return;
    const alPerderse = () => setConAurora(false);
    contenedor.addEventListener('webglcontextlost', alPerderse, true);
    return () => contenedor.removeEventListener('webglcontextlost', alPerderse, true);
  }, [conAurora]);

  useEffect(() => {
    if (!conAurora || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let cuadros = 0;
    let inicio = 0;
    const comienzo = performance.now();
    const medir = (ahora: number) => {
      if (document.hidden) {
        // En segundo plano los cuadros no cuentan: se vuelve a empezar.
        cuadros = 0;
        inicio = 0;
      } else if (ahora - comienzo >= ESPERA_MEDICION_MS) {
        if (!inicio) inicio = ahora;
        cuadros++;
        if (ahora - inicio >= DURACION_MEDICION_MS) {
          const fps = (cuadros * 1000) / (ahora - inicio);
          if (fps < FPS_MINIMO) setConAurora(false);
          return;
        }
      }
      raf = requestAnimationFrame(medir);
    };
    raf = requestAnimationFrame(medir);
    return () => cancelAnimationFrame(raf);
  }, [conAurora]);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 bg-[#0a1522]"
      style={conAurora ? undefined : { backgroundImage: RESPALDO }}
      aria-hidden="true"
    >
      {conAurora && (
        <div className="absolute inset-0">
          <Aurora
            colorStops={COLORES}
            amplitude={1.2}
            blend={0.9}
            height={0.95}
            glow={0.8}
            brightness={0.8}
            speed={0.45}
            layers={2}
            mouseInteraction={false}
            dpr={0.6}
            maxFps={30}
          />
        </div>
      )}
    </div>
  );
}
