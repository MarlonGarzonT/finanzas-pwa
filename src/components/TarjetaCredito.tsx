import { colorCategoria } from '../utils/colorCategoria';
import { describirProximaCuota, emojiCredito, formatearDiaConAnio, type EstadoCredito } from '../utils/creditos';
import { formatearMonto } from '../utils/fechas';
import type { TonoVencimiento } from '../utils/prestamos';
import { AvatarEmoji } from './AvatarEmoji';
import { BotonPrincipal } from './BotonPrincipal';
import { IconoCheck } from './Iconos';
import { TiraCuotas } from './TiraCuotas';

interface Props {
  credito: EstadoCredito;
  onAbrir: (credito: EstadoCredito) => void;
  onRegistrarPago: (credito: EstadoCredito) => void;
  // El botón con luz es lo único que llama la atención de la pantalla: solo
  // lo lleva la cuota más urgente; las demás tienen el mismo botón, quieto.
  conEfectos?: boolean;
}

// El estado se dice con palabras y un punto; el color solo lo refuerza (igual
// que en las tarjetas de préstamos).
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

// Un crédito: qué es, en qué cuota va (lo más grande de la tarjeta), la tira
// con una rayita por cuota, cuánto se ha ido en intereses y el botón para
// anotar el pago. Superficie neutra como el resto de la app: el color vive solo
// en los datos (verde las cuotas pagadas, coral los intereses).
export function TarjetaCredito({ credito: c, onAbrir, onRegistrarPago, conEfectos = false }: Props) {
  const { texto, tono } = describirProximaCuota(c);
  return (
    <li className="overflow-hidden rounded-[24px] bg-ios-light-surface-1 dark:bg-ios-dark-surface-1">
      <button
        type="button"
        onClick={() => onAbrir(c)}
        aria-label={
          c.saldado
            ? `${c.nombre}, crédito pagado. Ver detalle`
            : `${c.nombre}, cuota ${c.cuotasPagadas + 1} de ${c.plazoMeses}, ${formatearMonto(c.cuota)} al mes. ${texto}. Ver detalle`
        }
        className="block w-full px-4 pt-4 pb-3 text-left transition-colors active:bg-black/5 dark:active:bg-white/8"
      >
        <span className="flex items-center gap-3">
          <AvatarEmoji emoji={emojiCredito(c.nombre)} color={colorCategoria(c.id)} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[17px] font-semibold">
              {c.nombre}
              {c.entidad && <span className="font-normal text-secundario"> · {c.entidad}</span>}
            </span>
            <span className={`mt-0.5 flex items-center gap-1.5 text-[14px] ${COLOR_ESTADO[tono]}`}>
              {tono === 'pagado' ? (
                <IconoCheck className="size-3.5 text-ingreso" />
              ) : (
                <span className={`size-1.5 shrink-0 rounded-full ${COLOR_PUNTO[tono]}`} aria-hidden="true" />
              )}
              <span className="truncate">{texto}</span>
            </span>
          </span>
        </span>

        <span className="mt-4 flex items-end justify-between gap-3">
          <span className="block text-[40px] leading-none font-bold tracking-[-0.03em] cifras">
            {c.saldado ? c.plazoMeses : c.cuotasPagadas + 1}
            <span className="text-[22px] font-semibold text-secundario"> de {c.plazoMeses}</span>
          </span>
          <span className="pb-0.5 text-right">
            <span className="block text-[17px] leading-tight font-semibold cifras">{formatearMonto(c.cuota)}</span>
            <span className="block text-[13px] text-secundario">por cuota</span>
          </span>
        </span>

        <span className="mt-3 block">
          <TiraCuotas plazo={c.plazoMeses} pagadas={c.cuotasPagadas} atrasada={c.vencida} />
        </span>
        <span className="mt-2 block text-[13px] text-secundario">
          {c.saldado
            ? `Terminaste el ${formatearDiaConAnio(c.fechaFinal)}`
            : `Faltan ${c.cuotasRestantes} cuotas · terminas el ${formatearDiaConAnio(c.fechaFinal)}`}
        </span>

        <span className="mt-3 grid grid-cols-2 gap-3 border-t border-black/[0.07] pt-3 dark:border-white/10">
          <span>
            <span className="block text-[13px] text-secundario">Intereses pagados</span>
            <span className="block text-[17px] font-semibold text-intereses cifras">{formatearMonto(Math.round(c.interesesPagados))}</span>
          </span>
          <span>
            <span className="block text-[13px] text-secundario">Falta pagar</span>
            <span className="block text-[17px] font-semibold cifras">{formatearMonto(c.porPagar)}</span>
          </span>
        </span>
      </button>

      {!c.saldado && (
        <div className="px-4 pb-4">
          <BotonPrincipal
            texto={`Registrar pago de la cuota ${c.cuotasPagadas + 1}`}
            etiqueta={`Registrar el pago de la cuota ${c.cuotasPagadas + 1} de ${c.nombre}`}
            onClick={() => onRegistrarPago(c)}
            efectos={conEfectos}
          />
        </div>
      )}
    </li>
  );
}
