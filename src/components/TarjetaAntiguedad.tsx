import { Block, Chip, Progressbar } from 'konsta/react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Antiguedad } from '../utils/antiguedad';
import { IconoMedalla } from './Iconos';
import ClickSpark, { type ClickSparkHandle } from './reactbits/ClickSpark';
import { useContarHasta } from './useContarHasta';

interface Props {
  antiguedad: Antiguedad;
  desde: Date;
}

const COLORES_LOGRO = {
  fillBgIos: 'bg-[var(--logro)]/15',
  fillTextIos: 'text-[var(--logro-texto)]',
};

const COLORES_PROGRESO = {
  trackBgIos: 'bg-pista',
  activeBgIos: 'bg-[var(--logro)]',
};

// El canvas de las chispas no entiende variables CSS: son los tonos de --logro.
const COLORES_CHISPAS = ['#ff9500', '#ffb340', '#ffcc00'];
const CLAVE_HITO_CELEBRADO = 'mi-cuadre:hito-celebrado';
// Después de que la tarjeta entra y la cifra termina de contar.
const ESPERA_CELEBRACION_MS = 650;

function leerHitoCelebrado(): number | null {
  try {
    const valor = localStorage.getItem(CLAVE_HITO_CELEBRADO);
    return valor ? Number(valor) : null;
  } catch {
    return null;
  }
}

function guardarHitoCelebrado(dias: number) {
  try {
    localStorage.setItem(CLAVE_HITO_CELEBRADO, String(dias));
  } catch {
    // Sin almacenamiento (modo privado): a lo sumo se celebra otra vez.
  }
}

// Chispas desde la medalla la primera vez que se ve un hito nuevo. Se
// recuerda en el teléfono cuál fue el último celebrado para no repetirlo.
function useCelebrarHito(
  diasHito: number | undefined,
  chispas: RefObject<ClickSparkHandle | null>,
  medalla: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!diasHito || leerHitoCelebrado() === diasHito) return;
    const id = window.setTimeout(() => {
      const caja = medalla.current?.getBoundingClientRect();
      if (!caja) return;
      chispas.current?.sparkAtClient(caja.left + caja.width / 2, caja.top + caja.height / 2);
      guardarHitoCelebrado(diasHito);
    }, ESPERA_CELEBRACION_MS);
    return () => window.clearTimeout(id);
  }, [diasHito, chispas, medalla]);
}

// Lo primero del perfil: cuánto tiempo lleva la persona usando la app, en
// grande y en meses de calendario, con la medalla del último hito y la
// barra hacia el siguiente (como las rachas de las apps de hábitos).
export function TarjetaAntiguedad({ antiguedad, desde }: Props) {
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const cifraAnimada = useContarHasta(montado ? (antiguedad.cifra ?? 0) : 0, 700);
  const { hitoAlcanzado, siguienteHito } = antiguedad;
  const chispasRef = useRef<ClickSparkHandle>(null);
  const medallaRef = useRef<HTMLSpanElement>(null);
  useCelebrarHito(hitoAlcanzado?.dias, chispasRef, medallaRef);
  const fechaInicio = desde.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Las chispas van por fuera de la tarjeta: su overflow-hidden las cortaría.
  return (
    <ClickSpark
      ref={chispasRef}
      manual
      shape="star"
      sparkColor={COLORES_CHISPAS}
      sparkCount={10}
      sparkRadius={46}
      sparkSize={11}
      duration={750}
      randomness={0.5}
    >
      <Block strong inset className="aparecer-suave relative mt-6 mb-0 overflow-hidden rounded-3xl p-0">
        {/* Resplandor cálido de fondo: solo decoración, da calidez al logro. */}
        <span
          className="pointer-events-none absolute -top-16 -right-12 size-48 rounded-full bg-[var(--logro)] opacity-[0.14] blur-3xl dark:opacity-20"
          aria-hidden="true"
        />

        <div className="relative px-5 pt-4 pb-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-[15px] font-semibold text-secundario">Llevas en Mi Cuadre</h2>
            {hitoAlcanzado ? (
              <Chip
                colors={COLORES_LOGRO}
                className="shrink-0 font-semibold"
                media={
                  <span ref={medallaRef} className="flex size-7 items-center justify-center rounded-full bg-[var(--logro)] text-white">
                    <IconoMedalla className="size-4" />
                  </span>
                }
              >
                <span className="sr-only">Hito alcanzado: </span>
                {hitoAlcanzado.etiqueta}
              </Chip>
            ) : (
              <Chip colors={COLORES_LOGRO} className="shrink-0 font-semibold">
                Recién llegado
              </Chip>
            )}
          </div>

          <p className="m-0 mt-2 flex items-baseline gap-2 leading-none" aria-label={antiguedad.texto}>
            {antiguedad.cifra === null ? (
              <span className="text-[56px] font-bold tracking-[-0.03em]">Hoy</span>
            ) : (
              <>
                <span className="text-[56px] font-bold tracking-[-0.03em] cifras" aria-hidden="true">
                  {Math.round(cifraAnimada)}
                </span>
                <span className="text-[24px] font-semibold tracking-tight" aria-hidden="true">
                  {antiguedad.unidad}
                </span>
              </>
            )}
          </p>
          {antiguedad.resto && (
            <p className="m-0 mt-1 text-[17px] text-secundario" aria-hidden="true">
              {antiguedad.resto}
            </p>
          )}
          <p className="m-0 mt-3 text-[13px] text-secundario">
            {antiguedad.cifra === null ? 'Te damos la bienvenida.' : `Desde el ${fechaInicio}`}
          </p>
        </div>

        <div className="relative border-t border-black/[0.06] px-5 pt-3 pb-4 dark:border-white/10">
          {siguienteHito ? (
            <>
              <div className="flex items-baseline justify-between gap-3 text-[15px]">
                <span>
                  <span className="text-secundario">Próximo hito: </span>
                  <span className="font-semibold">{siguienteHito.etiqueta}</span>
                </span>
                <span className="shrink-0 text-[13px] text-secundario cifras">
                  {antiguedad.diasParaSiguiente === 1 ? 'Falta 1 día' : `Faltan ${antiguedad.diasParaSiguiente} días`}
                </span>
              </div>
              <Progressbar
                progress={montado ? antiguedad.progreso : 0}
                colors={COLORES_PROGRESO}
                className="mt-2.5 h-2 [&>span]:duration-1000 [&>span]:ease-[cubic-bezier(0.22,1,0.36,1)]"
                role="progressbar"
                aria-label={`Avance hacia el hito de ${siguienteHito.etiqueta}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(antiguedad.progreso * 100)}
              />
            </>
          ) : (
            <p className="m-0 text-[15px]">
              <span className="font-semibold">Alcanzaste todos los hitos.</span>{' '}
              <span className="text-secundario">Gracias por quedarte.</span>
            </p>
          )}
        </div>
      </Block>
    </ClickSpark>
  );
}
