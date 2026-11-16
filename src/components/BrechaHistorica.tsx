import { BlockHeader, Glass } from 'konsta/react';
import { useId, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, usePlotArea, useXAxisScale, useYAxisScale, XAxis, YAxis } from 'recharts';
import type { HistorialAcumulado } from '../utils/historialAcumulado';
import { formatearMonto, nombreMes } from '../utils/fechas';
import { FondoVidrio } from './FondoVidrio';
import { MontoAnimado } from './MontoAnimado';
import BorderGlow from './reactbits/BorderGlow';
import GradientText from './reactbits/GradientText';
import ShinyText from './reactbits/ShinyText';

interface Props {
  historial: HistorialAcumulado;
}

interface PuntoGrafica {
  // Primer día del mes; el origen (cero) no tiene mes.
  mes: Date | null;
  etiqueta: string;
  ingresos: number;
  gastos: number;
}

// Paleta tomada de la referencia del usuario: menta para lo que entra y coral
// para lo que sale. Toda la tarjeta es oscura en claro y en oscuro: el vidrio
// necesita un fondo vivo detrás, y el texto va siempre en blanco.
const VERDE = '#31d494';
const CORAL = '#ff7080';
const COLORES_TITULO = ['#ffffff', '#c9f7e2', '#c3d4f7'];

const FICHAS = {
  entro: { glow: '158 66 52', colores: [VERDE, '#7ee0c4', '#217b56'], fondo: '#0e2a24', texto: '#4ee0a8' },
  salio: { glow: '352 100 72', colores: [CORAL, '#ff9aa5', '#f2495c'], fondo: '#2e1820', texto: '#ff8c99' },
};

function mesCorto(fecha: Date): string {
  const mes = fecha.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
  return `${mes} ${String(fecha.getFullYear()).slice(2)}`;
}

function fraseBrecha({ brecha, tasa, ingresos }: HistorialAcumulado): string {
  if (ingresos === 0) return 'Aún no registras ingresos: todo lo que ves es gasto.';
  if (brecha < 0) return `Has gastado ${formatearMonto(-brecha)} más de lo que ha entrado.`;
  if (brecha === 0 || tasa === null) return 'Has gastado exactamente lo que ha entrado.';
  const deCada100 = Math.round(tasa * 100);
  if (deCada100 === 0) return 'Has gastado casi todo lo que ha entrado.';
  return `De cada $100 que entraron, te quedaron $${deCada100}.`;
}

// Con "reducir movimiento" las curvas aparecen ya dibujadas.
function prefiereMenosMovimiento(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function Ficha({ tipo, monto }: { tipo: 'entro' | 'salio'; monto: number }) {
  const ficha = FICHAS[tipo];
  const esEntro = tipo === 'entro';
  return (
    <BorderGlow backgroundColor={ficha.fondo} glowColor={ficha.glow} colors={ficha.colores} borderRadius={20} glowRadius={34} fillOpacity={0.35} animated className="min-w-0">
      <div className="px-3.5 py-3" style={{ color: ficha.texto }}>
        <span className="flex items-center gap-1.5 text-[13px] font-semibold">
          <span className="flex size-5 items-center justify-center rounded-full" style={{ background: `${ficha.texto}33` }}>
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d={esEntro ? 'M12 19V5.5M6.5 11 12 5.5l5.5 5.5' : 'M12 5v13.5M6.5 13l5.5 5.5 5.5-5.5'} />
            </svg>
          </span>
          {esEntro ? 'Entró' : 'Salió'}
        </span>
        <span className="mt-1 block text-[21px] leading-tight font-bold tracking-[-0.02em] cifras">
          <MontoAnimado monto={monto} signo={esEntro ? '+' : '−'} />
        </span>
      </div>
    </BorderGlow>
  );
}

// Flecha doble sobre la brecha, con su etiqueta, como en la referencia. Se
// dibuja dentro del SVG de Recharts con las escalas de los ejes, así sigue a
// las curvas al cambiar de tamaño. Si las dos curvas casi se tocan no se
// dibuja (no cabría ni la flecha).
function FlechaBrecha({ punto, etiqueta }: { punto: PuntoGrafica; etiqueta: string }) {
  const escalaX = useXAxisScale();
  const escalaY = useYAxisScale();
  const area = usePlotArea();
  if (!escalaX || !escalaY || !area) return null;
  const x = escalaX(punto.etiqueta);
  const yArriba = escalaY(Math.max(punto.ingresos, punto.gastos));
  const yAbajo = escalaY(Math.min(punto.ingresos, punto.gastos));
  if (typeof x !== 'number' || typeof yArriba !== 'number' || typeof yAbajo !== 'number' || yAbajo - yArriba < 30) return null;

  const ancho = etiqueta.length * 7.4 + 24;
  // La etiqueta va sobre la flecha, en el espacio libre encima de la curva más
  // alta, y se corre hacia adentro si la flecha queda en el borde.
  const xEtiqueta = Math.min(Math.max(x - ancho / 2, area.x), area.x + area.width - ancho);
  const yEtiqueta = yArriba - 34;
  const punta = 5;
  return (
    <g pointerEvents="none" aria-hidden="true">
      <path
        d={`M${x} ${yArriba + 2} V${yAbajo - 2} M${x - punta} ${yArriba + 2 + punta} L${x} ${yArriba + 2} L${x + punta} ${yArriba + 2 + punta} M${x - punta} ${yAbajo - 2 - punta} L${x} ${yAbajo - 2} L${x + punta} ${yAbajo - 2 - punta}`}
        fill="none"
        stroke="#fff"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x={xEtiqueta} y={yEtiqueta} width={ancho} height={28} rx={14} fill="rgb(255 255 255 / 0.96)" />
      <text x={xEtiqueta + ancho / 2} y={yEtiqueta + 18.5} textAnchor="middle" fontSize={13} fontWeight={700} fill="#0c1a2b">
        {etiqueta}
      </text>
    </g>
  );
}

// Todo el historial del usuario en una sola tarjeta de vidrio, y lo primero de
// Reportes: lo que ha entrado (menta) y lo que ha salido (coral), acumulado mes
// a mes desde el primer movimiento. Las curvas arrancan juntas en cero y el
// espacio entre ellas, marcado con una flecha, es la brecha de la frase de
// Morgan Housel. Fondo animado (Aurora), panel de vidrio (Glass de Konsta),
// gráfica con Recharts y fichas con BorderGlow.
export function BrechaHistorica({ historial }: Props) {
  const { puntos, ingresos, gastos, brecha } = historial;
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [indiceActivo, setIndiceActivo] = useState<number | null>(null);
  const [sinMovimiento] = useState(prefiereMenosMovimiento);

  // Un punto de origen en cero antes del primer mes: las curvas nacen juntas.
  const datos = useMemo<PuntoGrafica[]>(
    () => [
      { mes: null, etiqueta: '', ingresos: 0, gastos: 0 },
      ...puntos.map((p) => ({ mes: p.mes, etiqueta: mesCorto(p.mes), ingresos: p.ingresos, gastos: p.gastos })),
    ],
    [puntos]
  );

  if (puntos.length === 0) return null;

  const activo = indiceActivo !== null && indiceActivo > 0 ? datos[indiceActivo] : null;
  const mostrado = activo ?? { ingresos, gastos };
  const brechaMostrada = mostrado.ingresos - mostrado.gastos;
  const primerMes = puntos[0].mes;
  // La flecha va donde la brecha es mayor (ahí se ve mejor), o sigue al dedo.
  const indiceMayorBrecha = datos.reduce((mejor, p, i) => (Math.abs(p.ingresos - p.gastos) > Math.abs(datos[mejor].ingresos - datos[mejor].gastos) ? i : mejor), 1);
  const indiceFlecha = indiceActivo !== null && indiceActivo > 0 ? indiceActivo : Math.max(1, indiceMayorBrecha);
  const etiquetaFlecha = brechaMostrada < 0 ? 'Lo que faltó' : 'Tu ahorro';

  return (
    <section className="dark relative mx-4 mt-2 overflow-hidden rounded-[32px] p-4 text-white" aria-label="Ingresos y gastos de toda tu vida en Mi Cuadre">
      <FondoVidrio />

      <div className="relative">
        {/* Título del módulo: la frase de Morgan Housel, centrada y arriba de todo. */}
        <figure className="m-0 mt-1 mb-6 text-center">
          <blockquote className="m-0 text-[26px] leading-[1.15] font-bold tracking-[-0.02em] text-balance">
            <GradientText colors={COLORES_TITULO} animationSpeed={7} glow={0.25}>
              El ahorro es la brecha entre tu ego y tus ingresos
            </GradientText>
          </blockquote>
          <figcaption className="mt-2 text-[13px] font-medium">
            <ShinyText text="Morgan Housel · La psicología del dinero" color="rgb(255 255 255 / 0.68)" shineColor="#ffffff" speed={4} delay={2} />
          </figcaption>
        </figure>

        <BlockHeader className="m-0! mb-1! px-0! text-[15px] font-semibold text-white/75">{brecha < 0 ? 'Te ha faltado' : 'Te ha quedado'}</BlockHeader>
        <p className="m-0 text-[44px] leading-[1.05] font-bold tracking-[-0.03em] cifras" style={{ color: brecha < 0 ? '#ff8c99' : '#4ee0a8' }}>
          <span className="sr-only">{primerMes ? `Desde ${nombreMes(primerMes)}: ` : ''}</span>
          <MontoAnimado monto={brecha} signo={brecha > 0 ? '+' : brecha < 0 ? '−' : ''} intro />
        </p>

        {/* Qué es cada curva, de un vistazo. Con el dedo sobre la gráfica pasan
            a mostrar el mes tocado. */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Ficha tipo="entro" monto={mostrado.ingresos} />
          <Ficha tipo="salio" monto={mostrado.gastos} />
        </div>

        {/* Panel de vidrio (Liquid Glass de Konsta) con la gráfica. */}
        <Glass className="mt-4 rounded-[26px] p-4" style={{ touchAction: 'pan-y' }}>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <h2 className="m-0 text-[19px] leading-tight font-bold tracking-[-0.01em]">Ingresos vs. gastos</h2>
            <div className="flex items-center gap-3 text-[13px] font-semibold" aria-hidden="true">
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-5 rounded-full" style={{ background: VERDE }} />
                Ingresos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-5 rounded-full" style={{ background: CORAL }} />
                Gastos
              </span>
            </div>
          </div>

          <div
            className="relative mt-1 h-72 select-none"
            role="img"
            aria-label={`${primerMes ? `Desde ${nombreMes(primerMes)} ` : ''}han entrado ${formatearMonto(ingresos)} y han salido ${formatearMonto(gastos)}. ${fraseBrecha(historial)}`}
          >
            {activo?.mes && (
              <span
                className="pointer-events-none absolute top-1 left-9 z-10 rounded-full bg-black/35 px-2.5 py-1 text-[12px] font-semibold backdrop-blur-sm"
                aria-hidden="true"
              >
                Hasta {nombreMes(activo.mes)} · {brechaMostrada < 0 ? 'faltaron' : 'quedaron'} {formatearMonto(Math.abs(brechaMostrada))}
              </span>
            )}
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <AreaChart
                data={datos}
                margin={{ top: 40, right: 10, bottom: 4, left: 2 }}
                onMouseMove={(estado) => {
                  const indice = estado.activeTooltipIndex;
                  setIndiceActivo(typeof indice === 'number' ? indice : Number(indice ?? NaN) || null);
                }}
                onMouseLeave={() => setIndiceActivo(null)}
                accessibilityLayer={false}
              >
                <defs>
                  <linearGradient id={`${id}-verde`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={VERDE} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={VERDE} stopOpacity={0.04} />
                  </linearGradient>
                  <filter id={`${id}-brillo`} x="-5%" y="-30%" width="110%" height="160%">
                    <feGaussianBlur stdDeviation="4" result="difuso" />
                    <feMerge>
                      <feMergeNode in="difuso" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <YAxis
                  tick={false}
                  tickLine={false}
                  axisLine={{ stroke: 'rgb(255 255 255 / 0.6)', strokeWidth: 1.5 }}
                  width={30}
                  label={{ value: 'Dinero', angle: -90, position: 'insideLeft', fill: 'rgb(255 255 255 / 0.75)', fontSize: 12, fontWeight: 600, style: { textAnchor: 'middle' } }}
                />
                <XAxis
                  dataKey="etiqueta"
                  tick={false}
                  tickLine={false}
                  axisLine={{ stroke: 'rgb(255 255 255 / 0.6)', strokeWidth: 1.5 }}
                  height={28}
                  label={{ value: 'Tiempo', position: 'insideBottomRight', fill: 'rgb(255 255 255 / 0.75)', fontSize: 12, fontWeight: 600, offset: -2 }}
                />
                <Tooltip content={() => null} cursor={{ stroke: '#fff', strokeOpacity: 0.35, strokeWidth: 1, strokeDasharray: '3 3' }} isAnimationActive={false} />
                <Area
                  type="monotone"
                  dataKey="ingresos"
                  stroke={VERDE}
                  strokeWidth={4}
                  strokeLinecap="round"
                  fill={`url(#${id}-verde)`}
                  dot={false}
                  activeDot={{ r: 5.5, fill: VERDE, stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive={!sinMovimiento}
                  animationDuration={1200}
                  animationEasing="ease-out"
                  style={{ filter: `url(#${id}-brillo)` }}
                />
                <Area
                  type="monotone"
                  dataKey="gastos"
                  stroke={CORAL}
                  strokeWidth={4}
                  strokeLinecap="round"
                  fill="none"
                  dot={false}
                  activeDot={{ r: 5.5, fill: CORAL, stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive={!sinMovimiento}
                  animationDuration={1200}
                  animationBegin={150}
                  animationEasing="ease-out"
                />
                <FlechaBrecha punto={datos[indiceFlecha]} etiqueta={etiquetaFlecha} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Glass>
      </div>
    </section>
  );
}
