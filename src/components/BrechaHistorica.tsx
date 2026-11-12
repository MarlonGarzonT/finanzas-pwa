import { Block } from 'konsta/react';
import { useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import type { HistorialAcumulado } from '../utils/historialAcumulado';
import { capitalizarPrimera, formatearMonto, nombreMes } from '../utils/fechas';
import { MontoAnimado } from './MontoAnimado';

interface Props {
  historial: HistorialAcumulado;
}

// Lienzo de la gráfica en unidades propias; el SVG se estira al ancho de la
// tarjeta (los trazos no se deforman: vector-effect).
const ANCHO = 320;
const ALTO = 150;
const MARGEN_SUPERIOR = 10;

function mesCorto(fecha: Date): string {
  const mes = fecha.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
  return `${mes} ${fecha.getFullYear()}`;
}

function fraseBrecha({ brecha, tasa, ingresos }: HistorialAcumulado): string {
  if (ingresos === 0) return 'Aún no registras ingresos: todo lo que ves es gasto.';
  if (brecha < 0) return `Has gastado ${formatearMonto(-brecha)} más de lo que ha entrado.`;
  if (brecha === 0 || tasa === null) return 'Has gastado exactamente lo que ha entrado.';
  const deCada100 = Math.round(tasa * 100);
  if (deCada100 === 0) return 'Has gastado casi todo lo que ha entrado.';
  return `De cada $100 que entraron, te quedaron $${deCada100}.`;
}

// Todo el historial del usuario en una sola imagen: lo que ha entrado y lo que
// ha salido, acumulado mes a mes desde el primer movimiento. Las dos curvas
// arrancan juntas en cero y el espacio que se abre entre ellas es la brecha
// de la frase de Morgan Housel: lo que no se gastó. Al pasar el dedo se lee
// cómo iba la brecha en cada mes.
export function BrechaHistorica({ historial }: Props) {
  const { puntos, ingresos, gastos, brecha } = historial;
  const [indiceActivo, setIndiceActivo] = useState<number | null>(null);
  const graficaRef = useRef<HTMLDivElement>(null);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  // La tarjeta queda al final de Reportes: las curvas se dibujan la primera
  // vez que entra en pantalla, no al cargar la página (nadie lo vería).
  const [vista, setVista] = useState(() => typeof IntersectionObserver === 'undefined');
  const hayPuntos = historial.puntos.length > 0;
  useEffect(() => {
    const grafica = graficaRef.current;
    if (!grafica || vista) return;
    const observador = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((entrada) => entrada.isIntersecting)) return;
        setVista(true);
        observador.disconnect();
      },
      { threshold: 0.35 }
    );
    observador.observe(grafica);
    return () => observador.disconnect();
  }, [vista, hayPuntos]);

  if (puntos.length === 0) return null;

  // Un punto de origen en cero antes del primer mes: las curvas nacen juntas.
  const serie = [{ ingresos: 0, gastos: 0 }, ...puntos];
  const pasos = serie.length - 1;
  const maximo = Math.max(ingresos, gastos, 1);
  const x = (i: number) => (i / pasos) * ANCHO;
  const y = (valor: number) => ALTO - (valor / maximo) * (ALTO - MARGEN_SUPERIOR);
  const linea = (campo: 'ingresos' | 'gastos') => serie.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)} ${y(p[campo]).toFixed(2)}`).join(' ');
  const lineaIngresos = linea('ingresos');
  const lineaGastos = linea('gastos');
  const bajo = (trazo: string) => `${trazo} L${ANCHO} ${ALTO} L0 ${ALTO} Z`;
  // Banda entre las dos curvas: ingresos de ida y gastos de vuelta.
  const banda = `${lineaIngresos} ${[...serie].reverse().map((p, i) => `L${x(pasos - i).toFixed(2)} ${y(p.gastos).toFixed(2)}`).join(' ')} Z`;

  const activo = indiceActivo === null ? null : puntos[indiceActivo];
  const mostrado = activo ?? { ingresos, gastos };
  const brechaMostrada = mostrado.ingresos - mostrado.gastos;

  function seguirDedo(evento: PointerEvent<HTMLDivElement>) {
    const caja = graficaRef.current?.getBoundingClientRect();
    if (!caja || caja.width === 0) return;
    const fraccion = (evento.clientX - caja.left) / caja.width;
    // El origen (paso 0) no es un mes: el primer mes es el paso 1.
    const paso = Math.min(pasos, Math.max(1, Math.round(fraccion * pasos)));
    setIndiceActivo(paso - 1);
  }

  const primerMes = puntos[0].mes;
  const ultimoMes = puntos[puntos.length - 1].mes;
  const periodo =
    puntos.length === 1
      ? capitalizarPrimera(nombreMes(primerMes))
      : `Desde ${nombreMes(primerMes)} · ${puntos.length} meses`;
  const xActivo = indiceActivo === null ? null : x(indiceActivo + 1);

  return (
    <Block strong inset className="rounded-3xl p-4">
      <span className="block text-[13px] font-medium text-secundario">{periodo}</span>
      <p
        className={`m-0 mt-1 text-[34px] leading-tight font-bold tracking-[-0.02em] cifras ${
          brecha > 0 ? 'text-ingreso' : brecha < 0 ? 'text-alerta' : ''
        }`}
      >
        <span className="sr-only">{brecha < 0 ? 'Te ha faltado: ' : 'Te ha quedado: '}</span>
        <MontoAnimado monto={brecha} signo={brecha > 0 ? '+' : brecha < 0 ? '−' : ''} intro />
      </p>
      <p className="m-0 mt-0.5 text-[15px] leading-snug text-secundario">{fraseBrecha(historial)}</p>

      <div
        ref={graficaRef}
        className="relative mt-4 touch-pan-y text-black select-none dark:text-white"
        onPointerDown={seguirDedo}
        onPointerMove={seguirDedo}
        onPointerLeave={() => setIndiceActivo(null)}
        onPointerUp={(evento) => evento.pointerType !== 'mouse' && setIndiceActivo(null)}
        onPointerCancel={() => setIndiceActivo(null)}
        role="img"
        aria-label={`Desde ${nombreMes(primerMes)} han entrado ${formatearMonto(ingresos)} y han salido ${formatearMonto(gastos)}. ${fraseBrecha(historial)}`}
      >
        <div className={`overflow-hidden ${vista ? 'revelar-marco' : '-translate-x-full'}`}>
          <svg
            className="revelar-contenido block h-40 w-full overflow-visible"
            viewBox={`0 0 ${ANCHO} ${ALTO}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <clipPath id={`${id}-bajo-ingresos`}>
                <path d={bajo(lineaIngresos)} />
              </clipPath>
              <clipPath id={`${id}-bajo-gastos`}>
                <path d={bajo(lineaGastos)} />
              </clipPath>
            </defs>
            {/* La brecha: verde donde lo que entró va por encima de lo que
                salió; coral en los tramos donde se gastó más de lo que entró. */}
            <path d={banda} clipPath={`url(#${id}-bajo-ingresos)`} fill="var(--color-ingreso-relleno)" opacity="0.2" />
            <path d={banda} clipPath={`url(#${id}-bajo-gastos)`} fill="var(--color-alerta-relleno)" opacity="0.22" />
            <line x1="0" y1={ALTO} x2={ANCHO} y2={ALTO} stroke="currentColor" strokeOpacity="0.14" vectorEffect="non-scaling-stroke" />
            <path
              d={lineaGastos}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.8"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={lineaIngresos}
              fill="none"
              stroke="var(--color-ingreso-relleno)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* Mira del mes tocado: línea y un punto por serie, con aro del color
            de la tarjeta para separarlos de las curvas. */}
        {activo && xActivo !== null && (
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <span className="absolute top-0 bottom-0 w-px bg-current opacity-25" style={{ left: `${(xActivo / ANCHO) * 100}%` }} />
            {[
              { valor: activo.gastos, clase: 'bg-current' },
              { valor: activo.ingresos, clase: 'bg-ingreso-relleno' },
            ].map((punto) => (
              <span
                key={punto.clase}
                className={`absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white dark:ring-[#1c1c1e] ${punto.clase}`}
                style={{ left: `${(xActivo / ANCHO) * 100}%`, top: `${(y(punto.valor) / ALTO) * 100}%` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-1.5 flex justify-between text-[12px] text-secundario" aria-hidden="true">
        <span>{mesCorto(primerMes)}</span>
        {puntos.length > 1 && <span>{mesCorto(ultimoMes)}</span>}
      </div>

      {/* Leyenda con los totales; al tocar la gráfica muestra los de ese mes. */}
      <div className="mt-3 flex flex-col gap-1.5 text-[15px]" aria-hidden="true">
        <span className="text-[13px] font-medium text-secundario">
          {activo ? `Hasta ${nombreMes(activo.mes)}` : 'En total'}
          {activo && (
            <span className="cifras">
              {' · '}
              {brechaMostrada < 0 ? 'faltaron' : 'quedaron'} {formatearMonto(Math.abs(brechaMostrada))}
            </span>
          )}
        </span>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <span className="h-[3px] w-4 rounded-full bg-ingreso-relleno" />
            Entró
          </span>
          <span className="font-semibold text-ingreso cifras">+{formatearMonto(mostrado.ingresos)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <span className="h-[3px] w-4 rounded-full bg-black/80 dark:bg-white/80" />
            Salió
          </span>
          <span className="font-semibold cifras">−{formatearMonto(mostrado.gastos)}</span>
        </div>
      </div>

      <figure className="m-0 mt-4 border-t border-black/[0.06] pt-4 dark:border-white/10">
        <blockquote className="m-0 text-[17px] leading-snug font-semibold text-balance">
          «El ahorro es la brecha entre tu ego y tus ingresos».
        </blockquote>
        <figcaption className="mt-1.5 text-[13px] text-secundario">Morgan Housel, La psicología del dinero</figcaption>
      </figure>
    </Block>
  );
}
