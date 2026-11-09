import { BlockFooter, Button, List } from 'konsta/react';
import { useEffect, useState } from 'react';
import type { NuevoPrestamo, Prestamo } from '../types';
import { formatearMonto } from '../utils/fechas';
import { fechaLocalISO } from '../utils/prestamos';
import { CampoMonto } from './CampoMonto';
import { CampoTexto } from './CampoTexto';
import { HojaInferior } from './HojaInferior';

interface Props {
  abierto: boolean;
  // null: se está registrando uno nuevo.
  prestamo: Prestamo | null;
  onCerrar: () => void;
  onGuardar: (datos: NuevoPrestamo) => Promise<void>;
}

export function EditarPrestamoSheet({ abierto, prestamo, onCerrar, onGuardar }: Props) {
  const [monto, setMonto] = useState('');
  const [persona, setPersona] = useState('');
  const [fechaDevolucion, setFechaDevolucion] = useState('');
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto) return;
    setMonto(prestamo ? String(Math.round(prestamo.monto)) : '');
    setPersona(prestamo?.persona ?? '');
    setFechaDevolucion(prestamo?.fechaDevolucion ?? '');
    setNota(prestamo?.nota ?? '');
    setGuardando(false);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al abrir o cambiar de préstamo
  }, [abierto, prestamo?.id]);

  async function manejarGuardar() {
    const montoNum = Number(monto);
    const nombre = persona.trim();
    if (!prestamo && (!montoNum || montoNum <= 0)) return setError('Ingresa cuánto prestaste.');
    if (!nombre) return setError('Escribe a quién le prestaste.');
    if (!fechaDevolucion) return setError('Elige cuándo quedó de pagarte.');
    setError(null);
    setGuardando(true);
    try {
      await onGuardar({
        persona: nombre,
        monto: prestamo?.monto ?? montoNum,
        fechaDevolucion,
        nota: nota.trim() || null,
      });
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
      titulo={prestamo ? 'Editar préstamo' : 'Nuevo préstamo'}
      onCerrar={onCerrar}
      cierreBloqueado={guardando}
      cabecera={
        <div className="px-4 pb-3">
          {prestamo ? (
            <p className="m-0 py-1 text-center text-[44px] leading-tight font-bold tracking-tight cifras">
              {formatearMonto(prestamo.monto)}
            </p>
          ) : (
            <CampoMonto valor={monto} onCambiar={setMonto} etiqueta="Cuánto prestaste" autoFocus />
          )}
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
            {guardando ? 'Guardando…' : prestamo ? 'Guardar' : 'Registrar préstamo'}
          </Button>
        </>
      }
    >
      <List strong inset className="mt-2">
        <CampoTexto
          etiqueta="A quién"
          valor={persona}
          onCambiar={setPersona}
          placeholder="Nombre"
          autoComplete="off"
          autoCapitalize="words"
          enterKeyHint="next"
        />
        <CampoTexto
          etiqueta="Quedó de pagarte el"
          type="date"
          valor={fechaDevolucion}
          onCambiar={setFechaDevolucion}
          min={prestamo ? undefined : fechaLocalISO(new Date())}
        />
        <CampoTexto etiqueta="Nota" valor={nota} onCambiar={setNota} placeholder="Opcional" />
      </List>
      <BlockFooter>
        {prestamo
          ? 'El monto no se puede cambiar. Si te equivocaste, elimina el préstamo y regístralo de nuevo.'
          : 'Sale de tu Disponible de este mes y vuelve a él con cada abono. No cuenta como gasto.'}
      </BlockFooter>
    </HojaInferior>
  );
}
