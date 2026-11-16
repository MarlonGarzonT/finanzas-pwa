import { Block } from 'konsta/react';
import { useId, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import type { HistorialAcumulado } from '../utils/historialAcumulado';
import { capitalizarPrimera, formatearMonto, nombreMes } from '../utils/fechas';
import { MontoAnimado } from './MontoAnimado';

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
      <span className="block text-[13px] font-medium text-secundario">{periodo}</span>
      <p className="m-0 mt-1 text-[13px] font-medium text-secundario">{brecha < 0 ? 'Te ha faltado' : 'Te ha quedado'}</p>
      <p
        className={`m-0 text-[44px] leading-[1.05] font-bold tracking-[-0.03em] cifras ${
          brecha > 0 ? 'text-ingreso' : brecha < 0 ? 'text-alerta' : ''
        }`}
      >
        <MontoAnimado monto={brecha} signo={brecha > 0 ? '+' : brecha < 0 ? '−' : ''} intro />
      </p>
      <p className="m-0 mt-1 text-[15px] leading-snug text-secundario">{fraseBrecha(historial)}</p>

      {/* Fichas: qué es cada curva, de un vistazo. Con el dedo sobre la gráfica
          muestran el mes tocado. */}
      <div className="mt-4 grid grid-cols-2 gap-2" aria-hidden="true">
        <div className="rounded-2xl bg-ingreso-relleno/12 px-3 py-2.5">
          <span className="flex items-center gap-1.5 text-[13px] font-medium text-ingreso">
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5.5M6.5 11 12 5.5l5.5 5.5" />
            </svg>
            Entró
          </span>
          <span className="mt-0.5 block text-[19px] leading-tight font-bold text-ingreso cifras">+{formatearMonto(mostrado.ingresos)}</span>
        </div>
        <div className="rounded-2xl bg-alerta-relleno/12 px-3 py-2.5">
          <span className="flex items-center gap-1.5 text-[13px] font-medium text-alerta">
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v13.5M6.5 13l5.5 5.5 5.5-5.5" />
            </svg>
            Salió
          </span>
          <span className="mt-0.5 block text-[19px] leading-tight font-bold text-alerta cifras">−{formatearMonto(mostrado.gastos)}</span>
        </div>
      </div>
      <p className="m-0 mt-2 h-5 text-[13px] text-secundario" aria-hidden="true">
        {activo?.mes ? (
          <>
            Hasta {nombreMes(activo.mes)}:{' '}
            <span className={`font-semibold cifras ${brechaMostrada < 0 ? 'text-alerta' : 'text-ingreso'}`}>
              {brechaMostrada < 0 ? 'faltaron' : 'quedaron'} {formatearMonto(Math.abs(brechaMostrada))}
            </span>
          </>
        ) : (
          'Toca la gráfica para ver cada mes'
        )}
      </p>

      <div
        className="-mx-1 mt-1 h-64 touch-pan-y select-none"
        role="img"
        aria-label={`Desde ${nombreMes(primerMes)} han entrado ${formatearMonto(ingresos)} y han salido ${formatearMonto(gastos)}. ${fraseBrecha(historial)}`}
      >
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
        <blockquote className="m-0 text-[17px] leading-snug font-semibold text-balance">
          «El ahorro es la brecha entre tu ego y tus ingresos».
        </blockquote>
        <figcaption className="mt-1.5 text-[13px] text-secundario">Morgan Housel, La psicología del dinero</figcaption>
      </figure>
    </Block>
  );
}
