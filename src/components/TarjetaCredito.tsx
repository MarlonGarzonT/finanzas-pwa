import { formatearMonto } from '../utils/fechas';
import { describirProximaCuota, emojiCredito, type EstadoCredito } from '../utils/creditos';
import type { TonoVencimiento } from '../utils/prestamos';
import { colorCategoria } from '../utils/colorCategoria';
import { AvatarEmoji } from './AvatarEmoji';
import { IconoCheck } from './Iconos';

interface Props {
  credito: EstadoCredito;
  onAbrir: (credito: EstadoCredito) => void;
  onRegistrarPago: (credito: EstadoCredito) => void;
}

// El estado se dice con palabras y un punto; el color solo lo refuerza.
const COLOR_ESTADO: Record<TonoVencimiento, string> = {
  tranquilo: 'text-secundario',
  pronto: 'text-black/75 dark:text-white/80',
  vencido: 'font-medium text-alerta',
  pagado: 'text-secundario',
};

const COLOR_PUNTO: Record<TonoVencimiento, string> = {
  tranquilo: 'bg-black/25 dark:bg-white/30',
  pronto: 'bg-primary',
  vencido: 'bg-alerta',
  pagado: 'bg-ingreso',
};

// Un crédito: qué es, en qué cuota va, cuándo vence la próxima y cuánto
// avanzó. Lo de arriba abre el detalle (intereses, tabla de cuotas); la acción
// más común, anotar que pagaste la cuota, está a la vista abajo.
export function TarjetaCredito({ credito: c, onAbrir, onRegistrarPago }: Props) {
  const { texto, tono } = describirProximaCuota(c);
  return (
    <li className="overflow-hidden rounded-[20px] bg-ios-light-surface-1 dark:bg-ios-dark-surface-1">
      <button
        type="button"
        onClick={() => onAbrir(c)}
        aria-label={
          c.saldado
            ? `${c.nombre}, crédito pagado. Ver detalle`
            : `${c.nombre}, cuota ${c.cuotasPagadas + 1} de ${c.plazoMeses}, ${formatearMonto(c.cuota)} al mes. ${texto}. Ver detalle`
        }
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-black/5 dark:active:bg-white/8"
      >
        <AvatarEmoji emoji={emojiCredito(c.nombre)} color={colorCategoria(c.id)} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-semibold">{c.nombre}</span>
          <span className={`mt-0.5 flex items-center gap-1.5 text-[14px] ${COLOR_ESTADO[tono]}`}>
            {tono === 'pagado' ? (
              <IconoCheck className="size-3.5 text-ingreso" />
            ) : (
              <span className={`size-1.5 shrink-0 rounded-full ${COLOR_PUNTO[tono]}`} aria-hidden="true" />
            )}
            <span className="truncate">{texto}</span>
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-[17px] font-semibold cifras">{formatearMonto(c.cuota)}</span>
          <span className="block text-[13px] text-secundario">al mes</span>
        </span>
      </button>

      <div className="-mt-1 px-4 pb-3.5">
        <div
          role="progressbar"
          aria-label={`${c.cuotasPagadas} de ${c.plazoMeses} cuotas pagadas`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(c.progreso * 100)}
          className="h-1.5 overflow-hidden rounded-full bg-pista"
        >
          <div className="barra-progreso h-full origin-left rounded-full bg-primary" style={{ transform: `scaleX(${c.progreso})` }} />
        </div>
        <p className="m-0 mt-1.5 text-[13px] text-secundario cifras">
          {c.saldado
            ? `${c.plazoMeses} de ${c.plazoMeses} cuotas`
            : `Cuota ${c.cuotasPagadas + 1} de ${c.plazoMeses} · faltan ${formatearMonto(c.porPagar)}`}
        </p>
      </div>

      {!c.saldado && (
        <button
          type="button"
          onClick={() => onRegistrarPago(c)}
          aria-label={`Registrar el pago de la cuota ${c.cuotasPagadas + 1} de ${c.nombre}`}
          className="flex min-h-11 w-full items-center justify-center border-t border-black/[0.06] text-[16px] font-medium text-primary transition-colors active:bg-primary/10 dark:border-white/10"
        >
          Registrar pago de la cuota {c.cuotasPagadas + 1}
        </button>
      )}
    </li>
  );
}
