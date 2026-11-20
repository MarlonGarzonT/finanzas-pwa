import { colorCategoria } from '../utils/colorCategoria';
import { describirProximaCuota, emojiCredito, segmentosCredito, type EstadoCredito } from '../utils/creditos';
import { formatearMonto } from '../utils/fechas';
import { AvatarEmoji } from './AvatarEmoji';
import { BotonPrincipal } from './BotonPrincipal';
import { IconoChevronDerecha } from './Iconos';
import { Segmentos } from './Segmentos';
import { SuperficieVidrio } from './SuperficieVidrio';
import { TiraCuotas } from './TiraCuotas';

interface Props {
  credito: EstadoCredito;
  onAbrir: (credito: EstadoCredito) => void;
  onRegistrarPago: (credito: EstadoCredito) => void;
  // El botón con luz es lo único que llama la atención de la pantalla: solo
  // lo lleva la cuota más urgente; las demás tienen el mismo botón, quieto.
  conEfectos?: boolean;
}

// Un crédito: qué es, en qué cuota va (lo más grande de la tarjeta), la tira
// con una rayita por cuota, cuánto se ha ido en intereses y el botón para
// anotar el pago. Material de vidrio sin fondo de color: el color vive solo en
// los datos (verde las cuotas pagadas, coral los intereses). "Ver detalle" es
// un botón discreto arriba a la derecha, no toda la tarjeta.
export function TarjetaCredito({ credito: c, onAbrir, onRegistrarPago, conEfectos = false }: Props) {
  const { texto } = describirProximaCuota(c);
  return (
    <li className="list-none">
      <SuperficieVidrio>
        <div className="px-4 pt-4 pb-4">
          <div className="flex items-center gap-3">
            <AvatarEmoji emoji={emojiCredito(c.nombre)} color={colorCategoria(c.id)} />
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-[17px] font-semibold">
                {c.nombre}
                {c.entidad && <span className="font-normal text-secundario"> · {c.entidad}</span>}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onAbrir(c)}
              aria-label={`Ver el detalle del crédito ${c.nombre}`}
              className="-mr-2 flex min-h-11 shrink-0 items-center gap-0.5 rounded-full px-2.5 text-[14px] font-medium text-primary transition-opacity active:opacity-50"
            >
              Ver detalle
              <IconoChevronDerecha className="size-4" />
            </button>
          </div>

          <div className="mt-4 flex items-end justify-between gap-3">
            <p className="m-0 text-[40px] leading-none font-bold tracking-[-0.03em] cifras">
              {c.saldado ? c.plazoMeses : c.cuotasPagadas + 1}
              <span className="text-[22px] font-semibold text-secundario"> de {c.plazoMeses}</span>
            </p>
            <div className="pb-0.5 text-right">
              <p className="m-0 text-[17px] leading-tight font-semibold cifras">{formatearMonto(c.cuota)}</p>
              <p className="m-0 text-[13px] text-secundario">por cuota</p>
            </div>
          </div>

          <div className="mt-3">
            <TiraCuotas plazo={c.plazoMeses} pagadas={c.cuotasPagadas} atrasada={c.vencida} />
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <Segmentos etiqueta={texto} items={segmentosCredito(c)} />
            <Segmentos
              items={[
                { etiqueta: 'Intereses pagados', valor: formatearMonto(Math.round(c.interesesPagados)), tono: 'intereses' },
                { etiqueta: 'Falta pagar', valor: formatearMonto(c.porPagar) },
              ]}
            />
          </div>

          {!c.saldado && (
            <div className="mt-4">
              <BotonPrincipal
                texto={`Registrar pago de la cuota ${c.cuotasPagadas + 1}`}
                etiqueta={`Registrar el pago de la cuota ${c.cuotasPagadas + 1} de ${c.nombre}`}
                onClick={() => onRegistrarPago(c)}
                efectos={conEfectos}
              />
            </div>
          )}
        </div>
      </SuperficieVidrio>
    </li>
  );
}
