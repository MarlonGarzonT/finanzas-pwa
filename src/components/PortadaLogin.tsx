import { useEffect, useRef, useState } from 'react';
import { CLASE_TITULO_PORTADA } from './claseTituloPortada';
import { MontoAnimado } from './MontoAnimado';
import Aurora from './reactbits/Aurora';
import GlareHover from './reactbits/GlareHover';
import ShinyText from './reactbits/ShinyText';
import SplitText from './reactbits/SplitText';
import StarBorder from './reactbits/StarBorder';
import TextType from './reactbits/TextType';
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

// Verdes azulados del logo para el anillo, según el tema (ver CabeceraPerfil).
const ANILLO_LOGO = {
  claro: { luz: '#138a77', rastro: '#43af9c', pista: 'rgb(67 175 156 / 0.3)' },
  oscuro: { luz: '#7ee0c4', rastro: '#43af9c', pista: 'rgb(67 175 156 / 0.4)' },
};

// Logo de la app con una estrella de luz dándole la vuelta (StarBorder). El
// ícono mide 64px + 4px de aire: el anillo sigue sus esquinas redondeadas.
export function LogoConAnillo({ src }: { src: string }) {
  const oscuro = useEsOscuro();
  const colores = oscuro ? ANILLO_LOGO.oscuro : ANILLO_LOGO.claro;
  return (
    <StarBorder
      as="div"
      theme={oscuro ? 'dark' : 'light'}
      radius={22}
      thickness={oscuro ? 1.5 : 2}
      duration={5}
      trailLength={0.35}
      glow={0.6}
      sparkle
      hover="none"
      clickPulse={false}
      color={colores.luz}
      trailColor={colores.rastro}
      borderColor={colores.pista}
      backgroundColor="transparent"
      style={{ padding: 4 }}
    >
      <img className="size-16 rounded-[18px]" src={src} alt="" width={64} height={64} />
    </StarBorder>
  );
}

const COSAS_QUE_CUADRAS = ['gastos', 'ingresos', 'préstamos', 'ahorros'];

// Lema que se escribe solo: "Cuadra tus gastos / ingresos / préstamos…".
// El lector de pantalla recibe la frase completa (TextType la deja en sr-only).
export function LemaAnimado() {
  return (
    <p className="m-0 text-[17px] text-secundario">
      <TextType
        as="span"
        prefix="Cuadra tus "
        text={COSAS_QUE_CUADRAS}
        className="font-semibold text-black dark:text-white"
        prefixColor="var(--texto-secundario)"
        typingSpeed={70}
        deletingSpeed={38}
        pauseDuration={1700}
        initialDelay={900}
        cursorStyle="bar"
        cursorColor="#43af9c"
      />
    </p>
  );
}

// Meses de ejemplo para la vista previa: Disponible = entró − salió.
const MESES_DE_MUESTRA = [
  { entro: 3_500_000, salio: 1_274_567 },
  { entro: 3_500_000, salio: 1_520_000 },
  { entro: 4_150_000, salio: 1_509_500 },
];
const CAMBIO_DE_MUESTRA_MS = 3400;

// Tarjeta de muestra del producto: el Disponible y sus dos totales, con los
// mismos dígitos que ruedan dentro de la app (Counter) y un destello que la
// cruza cada pocos segundos (GlareHover). Decorativa: va oculta al lector.
function VistaPreviaDisponible() {
  const [indice, setIndice] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setIndice((i) => (i + 1) % MESES_DE_MUESTRA.length), CAMBIO_DE_MUESTRA_MS);
    return () => window.clearInterval(id);
  }, []);
  const mes = MESES_DE_MUESTRA[indice];

  return (
    <GlareHover
      width="100%"
      background="#ffffff"
      borderRadius="28px"
      glareColor="#43af9c"
      glareOpacity={0.28}
      glareSize={45}
      mode="loop"
      interval={4.5}
      className="max-w-[360px] shadow-[0_24px_60px_-20px_rgb(0_0_0/0.55)]"
    >
      <div className="flex w-full flex-col gap-4 p-6 text-black">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-medium text-black/55">Disponible</span>
          <span className="text-[40px] leading-[1.1] font-bold tracking-[-0.03em] cifras">
            <MontoAnimado monto={mes.entro - mes.salio} intro />
          </span>
        </div>
        <div className="flex flex-col gap-2 border-t border-black/[0.07] pt-4 text-[15px]">
          <div className="flex items-center justify-between">
            <span className="text-black/60">Entró</span>
            <span className="font-semibold text-[#047857] cifras">
              <MontoAnimado monto={mes.entro} signo="+" />
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-black/60">Salió</span>
            <span className="font-semibold cifras">
              <MontoAnimado monto={mes.salio} signo="−" />
            </span>
          </div>
        </div>
      </div>
    </GlareHover>
  );
}

// Panel de marca para pantallas anchas: en un computador el formulario solo
// dejaba media pantalla vacía. Aurora de fondo, el nombre con brillo
// (ShinyText), la promesa en grande (SplitText) y el producto a la vista.
export function VitrinaProducto() {
  const [conAurora, setConAurora] = useState(soportaWebgl2);
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !conAurora) return;
    const alPerderse = () => setConAurora(false);
    panel.addEventListener('webglcontextlost', alPerderse, true);
    return () => panel.removeEventListener('webglcontextlost', alPerderse, true);
  }, [conAurora]);

  return (
    <aside
      ref={panelRef}
      className="relative flex min-h-[640px] flex-1 flex-col justify-between overflow-hidden rounded-[36px] bg-[#0a2a31] p-12 text-white"
      style={conAurora ? undefined : { backgroundImage: RESPALDO }}
      aria-hidden="true"
    >
      {conAurora && (
        <div className="pointer-events-none absolute inset-0">
          <Aurora colorStops={COLORES_AURORA} opacity={0.9} amplitude={1.1} blend={0.65} height={0.62} speed={0.5} layers={2} mouseInteraction={false} dpr={1} />
        </div>
      )}

      <ShinyText
        text="Mi Cuadre"
        className="relative text-[20px] font-semibold tracking-tight"
        color="rgb(255 255 255 / 0.78)"
        shineColor="#ffffff"
        speed={3.5}
        delay={1.5}
      />

      <div className="relative flex flex-col gap-5">
        <SplitText
          tag="p"
          text="Tus cuentas, cuadradas."
          className="m-0 max-w-[12ch] text-[56px] leading-[1.02] font-bold tracking-[-0.035em]"
          splitType="words"
          delay={90}
          duration={1}
          trigger="load"
          textAlign="left"
        />
        <p className="m-0 max-w-[36ch] text-[17px] leading-snug text-white/75">
          Registra lo que entra y lo que sale, y mira de un vistazo cuánto te queda.
        </p>
      </div>

      <div className="relative">
        <VistaPreviaDisponible />
      </div>
    </aside>
  );
}
