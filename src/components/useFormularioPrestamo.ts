import { useState } from 'react';
import type { NuevoPrestamo } from '../types';
import { fechaDePlazo } from '../utils/prestamos';

export const PASOS_PRESTAMO = ['Persona', 'Monto', 'Plazo'] as const;
const ULTIMO_PASO = PASOS_PRESTAMO.length - 1;

interface Argumentos {
  abierto: boolean;
  onGuardar: (datos: NuevoPrestamo) => Promise<void>;
  onCerrar: () => void;
}

// Estado y reglas del formulario de un préstamo nuevo, que se llena por pasos
// (a quién → cuánto → cuándo te paga), igual que un movimiento nuevo.
export function useFormularioPrestamo({ abierto, onGuardar, onCerrar }: Argumentos) {
  const [persona, setPersona] = useState('');
  const [monto, setMonto] = useState('');
  const [fechaDevolucion, setFechaDevolucion] = useState('');
  const [nota, setNota] = useState('');
  const [paso, setPaso] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cada vez que la hoja se abre arranca limpia. (Ajustar estado durante el
  // render al detectar el cambio evita el render extra de un efecto.)
  const [estabaAbierto, setEstabaAbierto] = useState(false);
  if (abierto !== estabaAbierto) {
    setEstabaAbierto(abierto);
    if (abierto) {
      setPersona('');
      setMonto('');
      // Quincena por defecto: es el plazo más común y queda a la vista para cambiarlo.
      setFechaDevolucion(fechaDePlazo('quincena'));
      setNota('');
      setPaso(0);
      setGuardando(false);
      setError(null);
    }
  }

  const personaValida = persona.trim().length > 0;
  const montoValido = Number(monto) > 0;
  // Cada paso exige lo suyo antes de seguir; el botón se apaga hasta entonces.
  const puedeContinuar = paso === 0 ? personaValida : paso === 1 ? montoValido : Boolean(fechaDevolucion);

  function irAlPaso(destino: number) {
    setError(null);
    // El teclado se cierra al salir de un campo; el último paso no tiene
    // campos que lo necesiten abierto.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setPaso(Math.max(0, Math.min(destino, ULTIMO_PASO)));
  }

  async function guardar() {
    if (!personaValida) {
      setPaso(0);
      return setError('Escribe a quién le prestaste.');
    }
    if (!montoValido) {
      setPaso(1);
      return setError('Ingresa cuánto prestaste.');
    }
    if (!fechaDevolucion) return setError('Elige cuándo quedó de pagarte.');
    setError(null);
    setGuardando(true);
    try {
      await onGuardar({ persona: persona.trim(), monto: Number(monto), fechaDevolucion, nota: nota.trim() || null });
      onCerrar();
    } catch {
      setError('No se pudo guardar. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return {
    persona,
    monto,
    fechaDevolucion,
    nota,
    paso,
    guardando,
    error,
    personaValida,
    montoValido,
    puedeContinuar,
    setPersona,
    setMonto,
    setFechaDevolucion,
    setNota,
    irAlPaso,
    guardar,
  };
}
