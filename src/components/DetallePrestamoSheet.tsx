import { Block, BlockTitle, Button, List, ListItem, Progressbar } from 'konsta/react';
import { useState } from 'react';
import type { Transaccion } from '../types';
import { formatearFechaCorta, formatearMonto } from '../utils/fechas';
import { formatearDia, type EstadoPrestamo } from '../utils/prestamos';
import { DialogoConfirmar } from './DialogoConfirmar';
import { HojaInferior } from './HojaInferior';
import { IconoPapelera } from './Iconos';

interface Props {
  abierto: boolean;
  prestamo: EstadoPrestamo | null;
  onCerrar: () => void;
  onAbonar: () => void;
  onEditar: () => void;
  onEliminar: () => Promise<void>;
  onEliminarAbono: (abono: Transaccion) => Promise<void>;
}

function lineaVencimiento(p: EstadoPrestamo): { texto: string; clase: string } {
  if (p.pagado) {
    return { texto: p.fechaPago ? `Te pagó todo el ${formatearFechaCorta(p.fechaPago)}` : 'Te pagó todo', clase: 'text-ingreso' };
  }
  const cuando = `Quedó de pagarte el ${formatearDia(p.fechaDevolucion)}`;
  if (!p.vencido) return { texto: cuando, clase: 'text-secundario' };
  const atraso = p.diasVencido === 1 ? 'venció ayer' : `venció hace ${p.diasVencido} días`;
  return { texto: `${cuando} · ${atraso}`, clase: 'text-alerta' };
}

export function DetallePrestamoSheet({ abierto, prestamo, onCerrar, onAbonar, onEditar, onEliminar, onEliminarAbono }: Props) {
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

  const vencimiento = prestamo ? lineaVencimiento(prestamo) : null;
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
                Registrar abono
              </Button>
            )}
          </>
        }
      >
        {prestamo && vencimiento && (
          <>
            <Block className="my-2 flex flex-col items-center gap-1 text-center">
              <span className="text-[15px] font-medium text-secundario">{prestamo.pagado ? 'Te pagó' : 'Te debe'}</span>
              <p className="m-0 text-[40px] leading-[1.1] font-bold tracking-[-0.03em] cifras">
                {formatearMonto(prestamo.pagado ? prestamo.monto : prestamo.saldo)}
              </p>
              <p className="m-0 text-[15px] text-secundario">
                De <span className="cifras">{formatearMonto(prestamo.monto)}</span>
                {prestamo.fechaPrestamo ? ` que le prestaste el ${formatearFechaCorta(prestamo.fechaPrestamo)}` : ''}
              </p>
              <p className={`m-0 text-[15px] font-medium text-balance ${vencimiento.clase}`}>{vencimiento.texto}</p>
              {prestamo.abonado > 0 && !prestamo.pagado && (
                <Progressbar
                  progress={progreso}
                  className="mt-3 h-2 w-full"
                  role="progressbar"
                  aria-label={`Te ha pagado ${formatearMonto(prestamo.abonado)} de ${formatearMonto(prestamo.monto)}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progreso * 100)}
                />
              )}
            </Block>

            {prestamo.nota && <Block className="my-2 text-[15px] leading-snug">{prestamo.nota}</Block>}

            {prestamo.abonos.length > 0 && (
              <>
                <BlockTitle>Abonos</BlockTitle>
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
                          aria-label={`Eliminar abono de ${formatearMonto(a.monto)} del ${formatearFechaCorta(a.fecha)}`}
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
        mensaje="Se borran el préstamo, su salida y los abonos. Tu Disponible queda como si nunca lo hubieras registrado."
        textoConfirmar="Eliminar"
        onConfirmar={() => {
          setConfirmandoEliminar(false);
          ejecutar(onEliminar, 'No se pudo eliminar. Intenta de nuevo.');
        }}
        onCancelar={() => setConfirmandoEliminar(false)}
      />

      <DialogoConfirmar
        abierto={abonoPorEliminar !== null}
        titulo="¿Eliminar este abono?"
        mensaje={
          abonoPorEliminar
            ? `${formatearMonto(abonoPorEliminar.monto)} vuelve a sumar a lo que te debe y sale de tu Disponible.`
            : ''
        }
        textoConfirmar="Eliminar"
        onConfirmar={() => {
          const abono = abonoPorEliminar;
          setAbonoPorEliminar(null);
          if (abono) ejecutar(() => onEliminarAbono(abono), 'No se pudo eliminar el abono. Intenta de nuevo.');
        }}
        onCancelar={() => setAbonoPorEliminar(null)}
      />
    </>
  );
}
