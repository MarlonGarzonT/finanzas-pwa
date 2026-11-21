import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatearMonto, formatearMontoCompacto } from '../utils/fechas';
import type { FilaCategoria, PuntoMensual } from '../utils/tablero';

// Mismos colores de la brecha de Reportes: menta lo que entra, coral lo que sale.
export const VERDE = '#31d494';
export const CORAL = '#ff7080';
const PROMEDIO = 'rgb(140 140 150 / 0.55)';
const TEXTO_EJE = 'var(--texto-secundario)';

function prefiereMenosMovimiento(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Leyenda en píldoras (línea de color + nombre), igual que la gráfica de la brecha.
export function Leyenda({ items }: { items: { nombre: string; color: string }[] }) {
  return (
    <ul className="m-0 mb-3 flex list-none flex-wrap gap-2 p-0">
      {items.map((i) => (
        <li key={i.nombre} className="flex items-center gap-2 rounded-full bg-black/[0.05] px-3 py-1 text-[13px] font-medium dark:bg-white/[0.08]">
          <span className="h-1.5 w-4 rounded-full" style={{ background: i.color }} aria-hidden="true" />
          {i.nombre}
        </li>
      ))}
    </ul>
  );
}

interface PropsTooltip {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string; fill?: string }[];
  label?: string;
}

// Etiqueta flotante con vidrio oscuro: nombre del grupo y cada valor con su color.
function TooltipTablero({ active, payload, label }: PropsTooltip) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dark rounded-2xl bg-[#14161c]/95 px-3.5 py-2.5 text-white shadow-[0_8px_24px_rgb(0_0_0/0.3)] ring-1 ring-white/10">
      <p className="m-0 mb-1 text-[13px] font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="m-0 flex items-center justify-between gap-4 text-[13px]">
          <span className="flex items-center gap-1.5 text-white/75">
            <span className="size-2 rounded-full" style={{ background: p.fill ?? p.color }} aria-hidden="true" />
            {p.name}
          </span>
          <span className="font-semibold cifras">{formatearMonto(Math.round(p.value ?? 0))}</span>
        </p>
      ))}
    </div>
  );
}

const MARGEN = { top: 22, right: 8, left: 0, bottom: 0 };

interface PropsTick {
  x?: number;
  y?: number;
  payload?: { value: string };
  emojis: Map<string, string>;
}

// El eje de categorías lleva su emoji (cabe en cualquier ancho); el nombre
// completo sale al pasar el cursor, en la etiqueta flotante.
function TickEmoji({ x = 0, y = 0, payload, emojis }: PropsTick) {
  return (
    <text x={x} y={y + 18} textAnchor="middle" fontSize={16}>
      {emojis.get(payload?.value ?? '') ?? '🏷️'}
    </text>
  );
}

function ejes(alto: number) {
  return {
    yAxis: <YAxis width={46} tickLine={false} axisLine={false} tickFormatter={(v: number) => (v === 0 ? '0' : formatearMontoCompacto(v))} tick={{ fill: TEXTO_EJE, fontSize: 12 }} />,
    grid: <CartesianGrid vertical={false} stroke="rgb(140 140 150 / 0.22)" strokeDasharray="3 4" />,
    alto,
  };
}

interface PropsComparativo {
  filas: FilaCategoria[];
  colorTotal: string;
  etiquetaTotal: string;
}

// Barras agrupadas por categoría: el promedio (gris) contra lo de este mes
// (color), como las gráficas del Excel. Solo se rotula lo de este mes para no
// llenar la gráfica de números.
export function GraficoComparativo({ filas, colorTotal, etiquetaTotal }: PropsComparativo) {
  const emojis = new Map(filas.map((f) => [f.nombre, f.emoji]));
  const datos = filas.slice(0, 10).map((f) => ({ nombre: f.nombre, Promedio: Math.round(f.promedio ?? 0), [etiquetaTotal]: f.total }));
  const { yAxis, grid } = ejes(280);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Leyenda items={[{ nombre: 'Promedio', color: PROMEDIO }, { nombre: etiquetaTotal, color: colorTotal }]} />
      <div className="max-h-[420px] min-h-[260px] flex-1" role="img" aria-label={`Barras de ${etiquetaTotal.toLowerCase()} contra promedio por categoría`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={MARGEN} barGap={3} barCategoryGap="22%">
            {grid}
            <XAxis dataKey="nombre" tickLine={false} axisLine={false} interval={0} height={30} tick={<TickEmoji emojis={emojis} />} />
            {yAxis}
            <Tooltip cursor={{ fill: 'rgb(140 140 150 / 0.12)' }} content={<TooltipTablero />} />
            <Bar dataKey="Promedio" fill={PROMEDIO} radius={[6, 6, 0, 0]} isAnimationActive={!prefiereMenosMovimiento()} />
            <Bar dataKey={etiquetaTotal} fill={colorTotal} radius={[6, 6, 0, 0]} isAnimationActive={!prefiereMenosMovimiento()}>
              <LabelList dataKey={etiquetaTotal} position="top" formatter={(v: unknown) => (typeof v === 'number' && v > 0 ? formatearMontoCompacto(v) : '')} fill="currentColor" fontSize={11} fontWeight={600} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Doce meses de ingresos contra gastos: de un vistazo se ve en qué meses la
// brecha fue verde y en cuáles roja.
export function GraficoMensual({ serie }: { serie: PuntoMensual[] }) {
  const datos = serie.map((p) => ({ nombre: `${MESES_CORTOS[p.mes.getMonth()]} ${String(p.mes.getFullYear()).slice(2)}`, Ingresos: Math.round(p.ingresos), Gastos: Math.round(p.gastos) }));
  const { yAxis, grid } = ejes(260);
  return (
    <div>
      <Leyenda items={[{ nombre: 'Ingresos', color: VERDE }, { nombre: 'Gastos', color: CORAL }]} />
      <div className="h-[260px]" role="img" aria-label="Ingresos y gastos de los últimos doce meses">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={MARGEN} barGap={3} barCategoryGap="24%">
            {grid}
            <XAxis dataKey="nombre" tickLine={false} axisLine={false} interval={0} tick={{ fill: TEXTO_EJE, fontSize: 12 }} />
            {yAxis}
            <Tooltip cursor={{ fill: 'rgb(140 140 150 / 0.12)' }} content={<TooltipTablero />} />
            <Bar dataKey="Ingresos" fill={VERDE} radius={[6, 6, 0, 0]} isAnimationActive={!prefiereMenosMovimiento()} />
            <Bar dataKey="Gastos" fill={CORAL} radius={[6, 6, 0, 0]} isAnimationActive={!prefiereMenosMovimiento()} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
