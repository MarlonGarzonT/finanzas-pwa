import { Block, BlockHeader } from 'konsta/react';
import { useId, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import type { HistorialAcumulado } from '../utils/historialAcumulado';
import { capitalizarPrimera, formatearMonto, nombreMes } from '../utils/fechas';
import { MontoAnimado } from './MontoAnimado';
import BorderGlow from './reactbits/BorderGlow';
import GradientText from './reactbits/GradientText';
import ShinyText from './reactbits/ShinyText';
import { useEsOscuro } from './useEsOscuro';

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

const VERDE = 'var(--color-ingreso-relleno)';
const ROJO = 'var(--color-alerta-relleno)';

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

// Colores de las fichas: HSL del verde y el rojo de dinero, y el fondo
// teñido por tema (BorderGlow pide el fondo como color sólido).
const FICHAS = {
  entro: {
    glow: '160 80 42',
    colores: ['#10b981', '#34d399', '#43af9c'],
    fondoClaro: '#e8f8f1',
    fondoOscuro: '#10261f',
  },
  salio: {
    glow: '8 85 60',
    colores: ['#f0563c', '#ff8d78', '#ff6b4a'],
    fondoClaro: '#fdecea',
    fondoOscuro: '#2c1612',
  },
};

function Ficha({ tipo, monto, oscuro }: { tipo: 'entro' | 'salio'; monto: number; oscuro: boolean }) {
  const ficha = FICHAS[tipo];
  const esEntro = tipo === 'entro';
  return (
    <BorderGlow
      backgroundColor={oscuro ? ficha.fondoOscuro : ficha.fondoClaro}
      glowColor={ficha.glow}
      colors={ficha.colores}
      borderRadius={20}
      glowRadius={34}
      fillOpacity={0.35}
      animated
      className="min-w-0"
    >
      <div className={`px-3.5 py-3 ${esEntro ? 'text-ingreso' : 'text-alerta'}`}>
        <span className="flex items-center gap-1.5 text-[13px] font-semibold">
          <span className={`flex size-5 items-center justify-center rounded-full ${esEntro ? 'bg-ingreso-relleno/20' : 'bg-alerta-relleno/20'}`}>
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

const COLORES_CITA = {
  claro: ['#16687c', '#10b981', '#43af9c'],
  oscuro: ['#7ee0c4', '#34d399', '#43af9c'],
};

// Con "reducir movimiento" las curvas aparecen ya dibujadas.
function prefiereMenosMovimiento(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Todo el historial del usuario en una sola imagen, y lo primero de Reportes:
// lo que ha entrado (verde) y lo que ha salido (rojo), acumulado mes a mes
// desde el primer movimiento. Las curvas arrancan juntas en cero y el espacio
// entre ellas es la brecha de la frase de Morgan Housel. Gráfica con Recharts;
// la leyenda son tres fichas con ícono, signo y monto, que al tocar la gráfica
// pasan a mostrar los valores de ese mes.
export function BrechaHistorica({ historial }: Props) {
  const { puntos, ingresos, gastos, brecha } = historial;
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [indiceActivo, setIndiceActivo] = useState<number | null>(null);
  const [sinMovimiento] = useState(prefiereMenosMovimiento);
  const oscuro = useEsOscuro();

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
  const periodo =
    puntos.length === 1 ? capitalizarPrimera(nombreMes(primerMes)) : `Desde ${nombreMes(primerMes)} · ${puntos.length} meses`;

  return (
    <Block strong inset className="mt-2 rounded-3xl p-4">
      <BlockHeader className="m-0! mb-1! px-0! text-[15px] font-semibold">{brecha < 0 ? 'Te ha faltado' : 'Te ha quedado'}</BlockHeader>
      <p
        className={`m-0 text-[44px] leading-[1.05] font-bold tracking-[-0.03em] cifras ${
          brecha > 0 ? 'text-ingreso' : brecha < 0 ? 'text-alerta' : ''
        }`}
      >
        <span className="sr-only">{periodo}: </span>
        <MontoAnimado monto={brecha} signo={brecha > 0 ? '+' : brecha < 0 ? '−' : ''} intro />
      </p>

      {/* Qué es cada curva, de un vistazo. Con el dedo sobre la gráfica pasan
          a mostrar el mes tocado. */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Ficha tipo="entro" monto={mostrado.ingresos} oscuro={oscuro} />
        <Ficha tipo="salio" monto={mostrado.gastos} oscuro={oscuro} />
      </div>

      <div
        className="relative -mx-1 mt-2 h-64 touch-pan-y select-none"
        role="img"
        aria-label={`Desde ${nombreMes(primerMes)} han entrado ${formatearMonto(ingresos)} y han salido ${formatearMonto(gastos)}. ${fraseBrecha(historial)}`}
      >
        {activo?.mes && (
          <span
            className="pointer-events-none absolute top-0 left-2 z-10 rounded-full bg-black/[0.06] px-2.5 py-1 text-[12px] font-semibold text-secundario backdrop-blur-sm dark:bg-white/10"
            aria-hidden="true"
          >
            Hasta {nombreMes(activo.mes)} · {brechaMostrada < 0 ? 'faltaron' : 'quedaron'} {formatearMonto(Math.abs(brechaMostrada))}
          </span>
        )}
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <AreaChart
            data={datos}
            margin={{ top: 14, right: 12, bottom: 0, left: 12 }}
            onMouseMove={(estado) => {
              const indice = estado.activeTooltipIndex;
              setIndiceActivo(typeof indice === 'number' ? indice : Number(indice ?? NaN) || null);
            }}
            onMouseLeave={() => setIndiceActivo(null)}
            accessibilityLayer={false}
          >
            <defs>
              <linearGradient id={`${id}-verde`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={VERDE} stopOpacity={0.5} />
                <stop offset="100%" stopColor={VERDE} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id={`${id}-rojo`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ROJO} stopOpacity={0.2} />
                <stop offset="100%" stopColor={ROJO} stopOpacity={0.02} />
              </linearGradient>
              <filter id={`${id}-brillo`} x="-5%" y="-30%" width="110%" height="160%">
                <feGaussianBlur stdDeviation="4" result="difuso" />
                <feMerge>
                  <feMergeNode in="difuso" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <XAxis
              dataKey="etiqueta"
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={36}
              tick={{ fontSize: 12, fill: 'var(--texto-secundario)' }}
              tickMargin={8}
            />
            <Tooltip
              content={() => null}
              cursor={{ stroke: 'currentColor', strokeOpacity: 0.3, strokeWidth: 1, strokeDasharray: '3 3' }}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="gastos"
              stroke={ROJO}
              strokeWidth={2.5}
              fill={`url(#${id}-rojo)`}
              dot={false}
              activeDot={{ r: 5, fill: ROJO, stroke: 'var(--color-white, #fff)', strokeWidth: 2 }}
              isAnimationActive={!sinMovimiento}
              animationDuration={1100}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="ingresos"
              stroke={VERDE}
              strokeWidth={3}
              fill={`url(#${id}-verde)`}
              dot={false}
              activeDot={{ r: 5, fill: VERDE, stroke: 'var(--color-white, #fff)', strokeWidth: 2 }}
              isAnimationActive={!sinMovimiento}
              animationDuration={1100}
              animationBegin={150}
              animationEasing="ease-out"
              style={{ filter: `url(#${id}-brillo)` }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <figure className="m-0 mt-3 border-t border-black/[0.06] pt-4 dark:border-white/10">
        <blockquote className="m-0 text-[21px] leading-snug font-bold tracking-[-0.01em] text-balance">
          <GradientText colors={oscuro ? COLORES_CITA.oscuro : COLORES_CITA.claro} animationSpeed={7} glow={oscuro ? 0.25 : 0}>
            «El ahorro es la brecha entre tu ego y tus ingresos».
          </GradientText>
        </blockquote>
        <figcaption className="mt-2 text-[13px] font-medium">
          <ShinyText text="Morgan Housel · La psicología del dinero" color={oscuro ? 'rgb(235 235 245 / 0.62)' : 'rgb(60 60 67 / 0.78)'} shineColor={oscuro ? '#ffffff' : '#0b6b66'} speed={4} delay={2} />
        </figcaption>
      </figure>
    </Block>
  );
}
