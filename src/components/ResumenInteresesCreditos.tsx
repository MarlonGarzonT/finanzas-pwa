import type { ResumenCreditos } from '../utils/creditos';
import { formatearMonto } from '../utils/fechas';
import { BarraReparto } from './BarraReparto';
import { SuperficieVidrio } from './SuperficieVidrio';

interface Props {
  resumen: ResumenCreditos;
}

// Con dos o más créditos, el total de todos juntos: cuánto falta, cuánto de lo
// pagado fue deuda y cuánto intereses. Va después de las tarjetas (lo primero
// es cada crédito) y en superficie neutra: no compite con el botón de pago.
export function ResumenInteresesCreditos({ resumen }: Props) {
  const { porPagar, interesesPagados, interesesPorPagar, capitalPagado } = resumen;
  return (
    <section aria-label="Todos tus créditos juntos" className="mx-4">
      <SuperficieVidrio className="p-4">
      <h2 className="m-0 text-[17px] font-semibold">Todos tus créditos juntos</h2>

      <dl className="m-0 mt-3 grid grid-cols-2 gap-3">
        <div>
          <dt className="text-[13px] text-secundario">Te falta pagar</dt>
          <dd className="m-0 text-[22px] leading-tight font-bold cifras">{formatearMonto(porPagar)}</dd>
        </div>
        <div>
          <dt className="text-[13px] text-secundario">Intereses por pagar</dt>
          <dd className="m-0 text-[22px] leading-tight font-bold text-intereses cifras">{formatearMonto(Math.round(interesesPorPagar))}</dd>
        </div>
      </dl>

      {capitalPagado + interesesPagados > 0 && (
        <div className="mt-4 border-t border-black/[0.07] pt-4 dark:border-white/10">
          <p className="m-0 mb-3 text-[15px] font-medium">Lo que llevas pagado</p>
          <BarraReparto capital={capitalPagado} intereses={interesesPagados} />
        </div>
      )}
      </SuperficieVidrio>
    </section>
  );
}
