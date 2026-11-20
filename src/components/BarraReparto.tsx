import { formatearMonto } from '../utils/fechas';

interface Props {
  // Lo que baja la deuda y lo que se va en intereses.
  capital: number;
  intereses: number;
  // Lo que se lee bajo cada parte: lo pagado ("Bajó tu deuda") o lo que falta ("Aún debes").
  etiquetaCapital?: string;
  etiquetaIntereses?: string;
}

const VERDE = '#31d494';
const CORAL = '#ff7080';

function Parte({ color, etiqueta, monto, porcentaje }: { color: string; etiqueta: string; monto: number; porcentaje: number }) {
  return (
    <div className="min-w-0 flex-1">
      <span className="flex items-center gap-1.5 text-[13px] text-secundario">
        <span className="size-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
        <span className="truncate">{etiqueta}</span>
      </span>
      <span className="mt-0.5 block text-[19px] leading-tight font-bold tracking-[-0.01em] cifras">{formatearMonto(Math.round(monto))}</span>
      <span className="text-[13px] text-secundario cifras">{Math.round(porcentaje)} %</span>
    </div>
  );
}

// Una cantidad partida en dos: la parte que baja la deuda (verde) y la que se
// va en intereses (coral). Es lo que más cuesta ver en el banco: de cada cuota,
// cuánto es plata que de verdad avanza y cuánto es el precio de prestarla.
export function BarraReparto({
  capital,
  intereses,
  etiquetaCapital = 'Bajó tu deuda',
  etiquetaIntereses = 'Fue en intereses',
}: Props) {
  const total = capital + intereses;
  const pCapital = total > 0 ? (capital / total) * 100 : 0;
  const pIntereses = total > 0 ? 100 - pCapital : 0;
  return (
    <div>
      <div
        role="img"
        aria-label={`De ${formatearMonto(Math.round(total))}, ${formatearMonto(Math.round(capital))} bajaron la deuda y ${formatearMonto(Math.round(intereses))} fueron intereses`}
        className="h-3 overflow-hidden rounded-full bg-black/10 dark:bg-white/15"
      >
        <div className="barra-progreso flex h-full origin-left gap-[2px]" style={{ transform: 'scaleX(1)' }}>
          <span className="h-full rounded-full" style={{ width: `${pCapital}%`, background: VERDE }} />
          <span className="h-full rounded-full" style={{ width: `${pIntereses}%`, background: CORAL }} />
        </div>
      </div>
      <div className="mt-3 flex gap-4">
        <Parte color={VERDE} etiqueta={etiquetaCapital} monto={capital} porcentaje={pCapital} />
        <Parte color={CORAL} etiqueta={etiquetaIntereses} monto={intereses} porcentaje={pIntereses} />
      </div>
    </div>
  );
}
