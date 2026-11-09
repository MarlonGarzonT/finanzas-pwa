import { formatearMonto } from '../utils/fechas';
import { IconoTendencia } from './Iconos';

interface Props {
  comparacion: { actual: number; anterior: number; deltaPorcentaje: number } | null;
  proyeccion: number | null;
}

// Franja horizontal bajo el balance: cómo va el gasto frente al mes pasado
// y, en el mes en curso, a cuánto llegaría al cierre a este ritmo.
export function ComparacionMes({ comparacion, proyeccion }: Props) {
  if (!comparacion && proyeccion === null) {
    return <p className="m-0 text-center text-[15px] text-secundario">Aún no hay historial suficiente para comparar.</p>;
  }

  const sube = comparacion ? comparacion.deltaPorcentaje > 0 : false;

  return (
    <div className="flex divide-x divide-black/10 dark:divide-white/10">
      {comparacion && (
        <div className="flex flex-1 flex-col gap-0.5 pr-3">
          <span className="text-[13px] text-secundario">Frente al mes pasado</span>
          <span className={`flex items-center gap-1 text-[22px] leading-tight font-bold cifras ${sube ? 'text-alerta' : 'text-ingreso'}`}>
            <IconoTendencia sube={sube} className="size-5" />
            {Math.abs(Math.round(comparacion.deltaPorcentaje))}%
          </span>
          <span className="text-[13px] leading-snug text-secundario">{sube ? 'más' : 'menos'} gasto</span>
        </div>
      )}
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
