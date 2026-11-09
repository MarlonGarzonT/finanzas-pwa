import type { ComparacionMensual } from '../utils/estadisticasMes';
import { formatearMonto } from '../utils/fechas';
import { IconoTendencia } from './Iconos';

interface Props {
  comparacion: ComparacionMensual | null;
  proyeccion: number | null;
}

// Franja horizontal bajo el balance: cómo va el gasto variable frente al mes
// anterior y, en el mes en curso, a cuánto llegaría al cierre a este ritmo.
// La cifra va en color neutro en los dos sentidos: gastar más que el mes
// pasado no siempre es malo (el SOAT, la matrícula) y la flecha y el texto ya
// dicen la dirección. La alerta queda para gastar más de lo que entró.
export function ComparacionMes({ comparacion, proyeccion }: Props) {
  if (!comparacion && proyeccion === null) {
    return <p className="m-0 text-center text-[15px] text-secundario">Aún no hay historial suficiente para comparar.</p>;
  }

  return (
    <div className="flex divide-x divide-black/10 dark:divide-white/10">
      {comparacion && <Comparacion comparacion={comparacion} conProyeccion={proyeccion !== null} />}
      {proyeccion !== null && (
        <div className={`flex flex-1 flex-col gap-0.5 ${comparacion ? 'pl-3' : ''}`}>
          <span className="text-[13px] text-secundario">Al cierre del mes</span>
          <span className="text-[22px] leading-tight font-bold cifras">{formatearMonto(proyeccion)}</span>
          <span className="text-[13px] leading-snug text-secundario">de gasto si sigues así</span>
        </div>
      )}
    </div>
  );
}

function Comparacion({ comparacion, conProyeccion }: { comparacion: ComparacionMensual; conProyeccion: boolean }) {
  const porcentaje = Math.abs(Math.round(comparacion.deltaPorcentaje));
  const igual = porcentaje === 0;
  const sube = comparacion.deltaPorcentaje > 0;
  const mes = comparacion.mesAnterior.toLocaleDateString('es-CO', { month: 'long' });
  const direccion = igual ? 'Mismo' : sube ? 'Más' : 'Menos';
  const periodo = comparacion.corte !== null ? ', a la misma fecha' : '';

  return (
    <div className={`flex flex-1 flex-col gap-0.5 ${conProyeccion ? 'pr-3' : ''}`}>
      <span className="text-[13px] text-secundario">Frente a {mes}</span>
      <span className="flex items-center gap-1 text-[22px] leading-tight font-bold cifras">
        {!igual && <IconoTendencia sube={sube} className="size-5" />}
        {porcentaje}%
      </span>
      <span className="text-[13px] leading-snug text-secundario">
        {direccion} gasto variable{periodo}
      </span>
    </div>
  );
}
