import { useEffect, useRef, useState } from 'react';
import { CLASE_TITULO_PORTADA } from './claseTituloPortada';
import Aurora from './reactbits/Aurora';
import SplitText from './reactbits/SplitText';
import { useEsOscuro } from './useEsOscuro';

// Portada del login: aurora con los verdes azulados del logo y el título que
// entra letra por letra. Vive en su propio chunk (Login lo carga con lazy),
// así GSAP y el shader no pesan en la app de quien ya inició sesión.

// Del degradado del logo: azul petróleo, verde menta y vuelta al petróleo.
const COLORES_AURORA = ['#16687c', '#43af9c', '#1f8a8c'];

function soportaWebgl2(): boolean {
  try {
    const contexto = document.createElement('canvas').getContext('webgl2');
    contexto?.getExtension('WEBGL_lose_context')?.loseContext();
    return contexto !== null;
  } catch {
    return false;
  }
}

// Respaldo sin WebGL: el mismo par de verdes del logo en degradados quietos.
const RESPALDO =
  'radial-gradient(70% 55% at 25% 0%, rgb(67 175 156 / 0.38), transparent 70%), radial-gradient(65% 50% at 80% 5%, rgb(22 104 124 / 0.38), transparent 72%)';

// Fondo decorativo detrás del logo y el título. Se desvanece hacia abajo para
// que el formulario quede sobre el fondo normal. Con "reducir movimiento" la
// aurora queda quieta. Si el teléfono no tiene WebGL2, o el contexto se pierde
// (memoria, GPU bloqueada), se quita el canvas: si no, Chrome pinta un recuadro
// blanco con una carita triste encima de la portada.
export function FondoAurora() {
  const oscuro = useEsOscuro();
  const [conAurora, setConAurora] = useState(soportaWebgl2);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor || !conAurora) return;
    // webglcontextlost no sube por el DOM: se escucha en fase de captura.
    const alPerderse = () => setConAurora(false);
    contenedor.addEventListener('webglcontextlost', alPerderse, true);
    return () => contenedor.removeEventListener('webglcontextlost', alPerderse, true);
  }, [conAurora]);

  return (
    <div
      ref={contenedorRef}
      className="pointer-events-none absolute inset-x-0 top-0 h-[62%] [mask-image:linear-gradient(to_bottom,#000_45%,transparent)]"
      style={conAurora ? undefined : { backgroundImage: RESPALDO }}
      aria-hidden="true"
    >
      {conAurora && (
        <Aurora
          colorStops={COLORES_AURORA}
          lightMode={!oscuro}
          opacity={oscuro ? 0.85 : 0.7}
          amplitude={0.9}
          blend={0.6}
          height={0.5}
          speed={0.6}
          mouseInteraction={false}
          dpr={1}
        />
      )}
    </div>
  );
}

// Título que sube letra por letra (solo transform y opacidad). Al cambiar
// entre "Bienvenido de nuevo" y "Crea tu cuenta" vuelve a entrar.
export function TituloAnimado({ texto }: { texto: string }) {
  return (
    <SplitText
      tag="h1"
      text={texto}
      className={CLASE_TITULO_PORTADA}
      splitType="chars"
      delay={28}
      duration={0.9}
      trigger="load"
      textAlign="center"
    />
  );
}
