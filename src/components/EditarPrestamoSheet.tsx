import { BlockFooter, Button, List } from 'konsta/react';
import { useEffect, useState } from 'react';
import type { NuevoPrestamo, Prestamo } from '../types';
import { formatearMonto } from '../utils/fechas';
import { CampoTexto } from './CampoTexto';
import { HojaInferior } from './HojaInferior';

interface Props {
  abierto: boolean;
  prestamo: Prestamo | null;
  onCerrar: () => void;
  onGuardar: (datos: NuevoPrestamo) => Promise<void>;
}

// Editar un préstamo que ya existe (uno nuevo se registra por pasos en
// NuevoPrestamoSheet). El monto no se cambia: la salida de plata y los pagos
// ya registrados quedarían descuadrados.
export function EditarPrestamoSheet({ abierto, prestamo, onCerrar, onGuardar }: Props) {
  const [persona, setPersona] = useState('');
  const [fechaDevolucion, setFechaDevolucion] = useState('');
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto) return;
    setPersona(prestamo?.persona ?? '');
    setFechaDevolucion(prestamo?.fechaDevolucion ?? '');
    setNota(prestamo?.nota ?? '');
    setGuardando(false);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al abrir o cambiar de préstamo
  }, [abierto, prestamo?.id]);

  async function manejarGuardar() {
    if (!prestamo) return;
    const nombre = persona.trim();
    if (!nombre) return setError('Escribe a quién le prestaste.');
    if (!fechaDevolucion) return setError('Elige cuándo quedó de pagarte.');
    setError(null);
    setGuardando(true);
    try {
      await onGuardar({ persona: nombre, monto: prestamo.monto, fechaDevolucion, nota: nota.trim() || null });
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
      titulo="Editar préstamo"
      onCerrar={onCerrar}
      cierreBloqueado={guardando}
      cabecera={
        <div className="px-4 pb-3">
          <p className="m-0 py-1 text-center text-[44px] leading-tight font-bold tracking-tight cifras">
            {prestamo ? formatearMonto(prestamo.monto) : ''}
          </p>
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
            {guardando ? 'Guardando…' : 'Guardar'}
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
          autoCapitalize="words"
          enterKeyHint="next"
        />
        <CampoTexto etiqueta="Quedó de pagarte el" type="date" valor={fechaDevolucion} onCambiar={setFechaDevolucion} />
        <CampoTexto etiqueta="Nota" valor={nota} onCambiar={setNota} placeholder="Opcional" />
      </List>
      <BlockFooter>El monto no se puede cambiar. Si te equivocaste, elimina el préstamo y regístralo de nuevo.</BlockFooter>
    </HojaInferior>
  );
}
