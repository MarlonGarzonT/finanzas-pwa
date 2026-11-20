import { formatearMonto } from '../utils/fechas';
import type { ResumenCreditos } from '../utils/creditos';
import { MontoAnimado } from './MontoAnimado';

interface Props {
  resumen: ResumenCreditos;
}

// Lo primero de Créditos: cuánto falta por pagar, en palabras cuántos créditos
// son y cuánto toca este mes; y debajo, lo que más le importa a quien paga un
// crédito sin saber cuánto se va en intereses: lo que ya pagó y lo que viene.
export function CabeceraCreditos({ resumen }: Props) {
  const { porPagar, activos, vencidos, interesesPagados, interesesPorPagar, cuotasDelMes } = resumen;
  return (
    <section className="flex flex-col items-center gap-0.5 px-4 pt-1 pb-3 text-center" aria-label="Lo que te falta por pagar">
      <p className="m-0 text-[48px] leading-[1.1] font-bold tracking-[-0.03em] cifras">
        <MontoAnimado monto={porPagar} />
      </p>
      <p className="m-0 text-[15px] text-secundario">
        {activos === 0
          ? 'por pagar'
          : `por pagar en ${activos} ${activos === 1 ? 'crédito' : 'créditos'}${cuotasDelMes > 0 ? ` · este mes ${formatearMonto(cuotasDelMes)}` : ''}`}
        {vencidos > 0 && (
          <span className="font-medium text-alerta">
            {' · '}
            {vencidos} {vencidos === 1 ? 'cuota atrasada' : 'cuotas atrasadas'}
          </span>
        )}
      </p>

      <dl className="m-0 mt-4 grid w-full max-w-sm grid-cols-2 gap-3 text-left">
        <div className="rounded-2xl bg-ios-light-surface-1 px-4 py-3 dark:bg-ios-dark-surface-1">
          <dt className="text-[13px] text-secundario">Intereses pagados</dt>
          <dd className="m-0 mt-0.5 text-[20px] font-bold cifras">{formatearMonto(Math.round(interesesPagados))}</dd>
        </div>
        <div className="rounded-2xl bg-ios-light-surface-1 px-4 py-3 dark:bg-ios-dark-surface-1">
          <dt className="text-[13px] text-secundario">Intereses por pagar</dt>
          <dd className="m-0 mt-0.5 text-[20px] font-bold cifras">{formatearMonto(Math.round(interesesPorPagar))}</dd>
        </div>
      </dl>
    </section>
  );
}
