import { Block, BlockTitle, Button, List, ListItem, Progressbar } from 'konsta/react';
import { useImperativeHandle, useRef, useState, type Ref } from 'react';
import type { Transaccion } from '../types';
import { formatearFechaCorta, formatearMonto } from '../utils/fechas';
import { describirVencimiento, formatearDia, type EstadoPrestamo, type TonoVencimiento } from '../utils/prestamos';
import { AvatarPersona } from './AvatarPersona';
import { DialogoConfirmar } from './DialogoConfirmar';
import { HojaInferior } from './HojaInferior';
import { IconoPapelera } from './Iconos';
import { MontoAnimado } from './MontoAnimado';
import ClickSpark, { type ClickSparkHandle } from './reactbits/ClickSpark';

export interface DetallePrestamoHandle {
  // Chispas detrás del monto: el préstamo acaba de quedar saldado.
  celebrarSaldado: () => void;
}

// Verdes del ingreso (DESIGN.md): la plata volvió. El naranja de logros es
// solo para el perfil.
const COLORES_SALDADO = ['#10b981', '#34d399', '#047857'];

interface Props {
  ref?: Ref<DetallePrestamoHandle>;
  abierto: boolean;
  prestamo: EstadoPrestamo | null;
  onCerrar: () => void;
  onAbonar: () => void;
  onEditar: () => void;
  onEliminar: () => Promise<void>;
  onEliminarAbono: (abono: Transaccion) => Promise<void>;
}

const COLOR_ESTADO: Record<TonoVencimiento, string> = {
  tranquilo: 'text-secundario',
  pronto: 'text-black/75 dark:text-white/80',
  vencido: 'text-alerta',
  pagado: 'text-ingreso',
};

const COLOR_PUNTO: Record<TonoVencimiento, string> = {
  tranquilo: 'bg-black/25 dark:bg-white/30',
  pronto: 'bg-primary',
  vencido: 'bg-alerta',
  pagado: 'bg-ingreso',
};

export function DetallePrestamoSheet({ ref, abierto, prestamo, onCerrar, onAbonar, onEditar, onEliminar, onEliminarAbono }: Props) {
  const chispasRef = useRef<ClickSparkHandle>(null);
  const montoRef = useRef<HTMLParagraphElement>(null);
  useImperativeHandle(ref, () => ({
    celebrarSaldado() {
      const caja = montoRef.current?.getBoundingClientRect();
      if (caja) chispasRef.current?.sparkAtClient(caja.left + caja.width / 2, caja.top + caja.height / 2);
    },
  }));
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [abonoPorEliminar, setAbonoPorEliminar] = useState<Transaccion | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ejecutar(accion: () => Promise<void>, mensajeError: string) {
    setOcupado(true);
    setError(null);
    try {
      await accion();
    } catch {
      setError(mensajeError);
    } finally {
      setOcupado(false);
    }
  }

  const vencimiento = prestamo ? describirVencimiento(prestamo) : null;
  const progreso = prestamo && prestamo.monto > 0 ? prestamo.abonado / prestamo.monto : 0;

  return (
    <>
      <HojaInferior
        abierto={abierto && prestamo !== null}
        titulo={prestamo?.persona ?? 'Préstamo'}
        onCerrar={onCerrar}
        textoCerrar="Cerrar"
        cierreBloqueado={ocupado}
        pie={
          <>
            {error && (
              <p className="m-0 text-center text-[15px] text-alerta" role="alert">
                {error}
              </p>
            )}
            {prestamo && !prestamo.pagado && (
              <Button large rounded onClick={onAbonar} disabled={ocupado}>
                Registrar pago
              </Button>
            )}
          </>
        }
      >
        {prestamo && vencimiento && (
          <>
            <Block className="my-2 flex flex-col items-center gap-1 text-center">
              <AvatarPersona persona={prestamo.persona} id={prestamo.id} grande />
              <span className="mt-2 text-[15px] font-medium text-secundario">{prestamo.pagado ? 'Te pagó' : 'Te debe'}</span>
              <ClickSpark
                ref={chispasRef}
                manual
                layer="back"
                sparkColor={COLORES_SALDADO}
                sparkCount={14}
                sparkRadius={100}
                sparkSize={16}
                sparkWidth={2.5}
                duration={700}
                randomness={0.4}
              >
                <p ref={montoRef} className="m-0 text-[40px] leading-[1.1] font-bold tracking-[-0.03em] cifras">
                  <MontoAnimado monto={prestamo.pagado ? prestamo.monto : prestamo.saldo} />
                </p>
              </ClickSpark>
              <p className="m-0 text-[15px] text-secundario">
                De <span className="cifras">{formatearMonto(prestamo.monto)}</span>
                {prestamo.fechaPrestamo ? ` que le prestaste el ${formatearFechaCorta(prestamo.fechaPrestamo)}` : ''}
              </p>
              <p className={`m-0 mt-1 flex items-center justify-center gap-1.5 text-[15px] font-medium ${COLOR_ESTADO[vencimiento.tono]}`}>
                <span className={`size-2 shrink-0 rounded-full ${COLOR_PUNTO[vencimiento.tono]}`} aria-hidden="true" />
                {vencimiento.texto}
                {!prestamo.pagado && (
                  <span className="font-normal text-secundario"> · quedó para el {formatearDia(prestamo.fechaDevolucion)}</span>
                )}
              </p>
              {!prestamo.pagado && (
                <div className="mt-3 flex w-full flex-col gap-1.5">
                  <Progressbar
                    progress={progreso}
                    className="h-2 w-full"
                    role="progressbar"
                    aria-label={`Te ha pagado ${formatearMonto(prestamo.abonado)} de ${formatearMonto(prestamo.monto)}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progreso * 100)}
                  />
                  <p className="m-0 text-[13px] text-secundario">
                    {prestamo.abonado > 0 ? (
                      <>
                        Ya te pagó <span className="font-semibold text-ingreso cifras">{formatearMonto(prestamo.abonado)}</span>
                      </>
                    ) : (
                      'Todavía no te ha pagado nada'
                    )}
                  </p>
                </div>
              )}
            </Block>

            {prestamo.nota && (
              <Block className="my-2 text-[15px] leading-snug">
                <span className="text-secundario">Nota: </span>
                {prestamo.nota}
              </Block>
            )}

            {prestamo.abonos.length > 0 && (
              <>
                <BlockTitle>Pagos que te hizo</BlockTitle>
                <List strong inset dividers>
                  {prestamo.abonos.map((a) => (
                    <ListItem
                      key={a.id}
                      title={<span className="font-semibold text-ingreso cifras">+{formatearMonto(a.monto)}</span>}
                      text={formatearFechaCorta(a.fecha)}
                      after={
                        <button
                          type="button"
                          className="-mr-2 flex size-11 items-center justify-center rounded-full text-alerta active:opacity-60 disabled:opacity-40"
                          aria-label={`Eliminar pago de ${formatearMonto(a.monto)} del ${formatearFechaCorta(a.fecha)}`}
                          onClick={() => setAbonoPorEliminar(a)}
                          disabled={ocupado}
                        >
                          <IconoPapelera className="size-5" />
                        </button>
                      }
                    />
                  ))}
                </List>
              </>
            )}

            <List strong inset className="mt-6">
              <ListItem
                link
                linkComponent="button"
                linkProps={{ type: 'button', disabled: ocupado }}
                onClick={onEditar}
                title="Editar préstamo"
                contentClassName="w-full text-left"
              />
              <ListItem
                link
                chevron={false}
                linkComponent="button"
                linkProps={{ type: 'button', disabled: ocupado }}
                onClick={() => setConfirmandoEliminar(true)}
                title={<span className="block w-full text-center font-medium text-alerta">Eliminar préstamo</span>}
                contentClassName="w-full [&_.shrink]:flex-1"
              />
            </List>
          </>
        )}
      </HojaInferior>

      <DialogoConfirmar
        abierto={confirmandoEliminar}
        titulo={`¿Eliminar el préstamo a ${prestamo?.persona ?? ''}?`}
        mensaje="Se borran el préstamo, la salida de plata y los pagos. Tu Disponible queda como si nunca lo hubieras registrado."
        textoConfirmar="Eliminar"
        onConfirmar={() => {
          setConfirmandoEliminar(false);
          ejecutar(onEliminar, 'No se pudo eliminar. Intenta de nuevo.');
        }}
        onCancelar={() => setConfirmandoEliminar(false)}
      />

      <DialogoConfirmar
        abierto={abonoPorEliminar !== null}
        titulo="¿Eliminar este pago?"
        mensaje={
          abonoPorEliminar
            ? `${formatearMonto(abonoPorEliminar.monto)} vuelve a sumar a lo que te debe y sale de tu Disponible.`
            : ''
        }
        textoConfirmar="Eliminar"
        onConfirmar={() => {
          const abono = abonoPorEliminar;
          setAbonoPorEliminar(null);
          if (abono) ejecutar(() => onEliminarAbono(abono), 'No se pudo eliminar el pago. Intenta de nuevo.');
        }}
        onCancelar={() => setAbonoPorEliminar(null)}
      />
    </>
  );
}
