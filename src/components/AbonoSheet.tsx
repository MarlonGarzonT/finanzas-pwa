import { Block, Button } from 'konsta/react';
import { useEffect, useState } from 'react';
import { formatearMonto } from '../utils/fechas';
import type { EstadoPrestamo } from '../utils/prestamos';
import { CampoMonto } from './CampoMonto';
import { ChipOpcion } from './ChipOpcion';
import { HojaInferior } from './HojaInferior';

interface Props {
  abierto: boolean;
  prestamo: EstadoPrestamo | null;
  onCerrar: () => void;
  onGuardar: (monto: number) => Promise<void>;
}

// Arranca con todo lo que falta (el caso más común: te pagaron completo); para
// un abono parcial se cambia el monto.
export function AbonoSheet({ abierto, prestamo, onCerrar, onGuardar }: Props) {
  const [monto, setMonto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saldo = prestamo?.saldo ?? 0;
  const montoNum = Number(monto);

  useEffect(() => {
    if (!abierto) return;
    setMonto(prestamo ? String(Math.round(prestamo.saldo)) : '');
    setGuardando(false);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al abrir
  }, [abierto]);

  async function manejarGuardar() {
    if (!montoNum || montoNum <= 0) return setError('Ingresa cuánto te pagó.');
    if (montoNum > saldo) return setError(`Es más de lo que te debe (${formatearMonto(saldo)}).`);
    setError(null);
    setGuardando(true);
    try {
      await onGuardar(montoNum);
      onCerrar();
    } catch {
      setError('No se pudo guardar. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <HojaInferior
      abierto={abierto}
      titulo={prestamo ? `Abono de ${prestamo.persona}` : 'Abono'}
      onCerrar={onCerrar}
      cierreBloqueado={guardando}
      cabecera={
        <div className="px-4 pb-3">
          <CampoMonto valor={monto} onCambiar={setMonto} tono="ingreso" etiqueta="Cuánto te pagó" autoFocus />
        </div>
      }
      pie={
        <>
          {error && (
            <p className="m-0 text-center text-[15px] text-alerta" role="alert">
              {error}
            </p>
          )}
          <Button large rounded onClick={manejarGuardar} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar abono'}
          </Button>
        </>
      }
    >
      <Block className="my-2 flex flex-col items-center gap-3 text-center">
        <p className="m-0 text-[15px] text-balance text-secundario">
          {/* Dice en palabras qué pasa con el saldo, en vez de marcar un chip. */}
          {montoNum > 0 && montoNum < saldo ? (
            <>
              Abono parcial: quedaría debiendo <span className="font-semibold cifras">{formatearMonto(saldo - montoNum)}</span>.
            </>
          ) : (
            <>
              Te debe <span className="font-semibold cifras">{formatearMonto(saldo)}</span>. Con este pago queda saldado.
            </>
          )}{' '}
          Lo que te pague vuelve a tu Disponible de este mes.
        </p>
        {montoNum !== saldo && (
          <ChipOpcion activo={false} onClick={() => setMonto(String(Math.round(saldo)))}>
            Me pagó todo
          </ChipOpcion>
        )}
      </Block>
    </HojaInferior>
  );
}
