import { Button, List } from 'konsta/react';
import { useState } from 'react';
import type { Tipo } from '../types';
import { CampoTexto } from './CampoTexto';
import { HojaInferior } from './HojaInferior';

interface Props {
  abierto: boolean;
  tipo: Tipo;
  onCerrar: () => void;
  onCrear: (nombre: string) => Promise<void>;
}

export function NuevaCategoriaSheet({ abierto, tipo, onCerrar, onCrear }: Props) {
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cerrar() {
    setNombre('');
    setError(null);
    onCerrar();
  }

  async function manejarCrear() {
    const limpio = nombre.trim();
    if (!limpio) return;
    setGuardando(true);
    setError(null);
    try {
      await onCrear(limpio);
      setNombre('');
    } catch {
      setError('No se pudo crear la categoría. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <HojaInferior
      abierto={abierto}
      titulo={`Nueva categoría de ${tipo === 'ingreso' ? 'entrada' : 'salida'}`}
      onCerrar={cerrar}
      cierreBloqueado={guardando}
      pie={
        <>
          {error && (
            <p className="m-0 text-center text-[15px] text-alerta" role="alert">
              {error}
            </p>
          )}
          <Button large rounded onClick={manejarCrear} disabled={guardando || !nombre.trim()}>
            {guardando ? 'Agregando…' : 'Agregar'}
          </Button>
        </>
      }
    >
      <List strong inset className="my-2">
        <CampoTexto etiqueta="Nombre" valor={nombre} onCambiar={setNombre} placeholder="Mercado, Gimnasio…" autoFocus />
      </List>
    </HojaInferior>
  );
}
