import { useState } from 'react';
import type { Tipo } from '../types';
import { useGestosSheet } from './useComportamientoSheet';
import './NuevoMovimientoSheet.css';

interface Props {
  abierto: boolean;
  tipo: Tipo;
  onCerrar: () => void;
  onCrear: (nombre: string) => Promise<void>;
}

export function NuevaCategoriaSheet({ abierto, tipo, onCerrar, onCrear }: Props) {
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const gestos = useGestosSheet(abierto, onCerrar);

  if (!abierto) return null;

  async function manejarCrear() {
    const limpio = nombre.trim();
    if (!limpio) return;
    setGuardando(true);
    await onCrear(limpio);
    setGuardando(false);
    setNombre('');
  }

  return (
    <div
      className="sheet-overlay sheet-overlay--anidado"
      onClick={onCerrar}
      style={gestos.overlayStyle}
    >
      <div
        className={`sheet ${gestos.arrastrando ? 'sheet--arrastrando' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onFocusCapture={gestos.onFocusCaptureSheet}
        style={gestos.sheetStyle}
      >
        <div className="sheet__header">
          <div
            className="sheet__handle-area"
            onPointerDown={gestos.onPointerDownHandle}
            onPointerMove={gestos.onPointerMoveHandle}
            onPointerUp={gestos.onPointerUpHandle}
            onPointerCancel={gestos.onPointerUpHandle}
          >
            <div className="sheet__handle" />
          </div>
          <h2 className="sheet__titulo">Nueva categoría de {tipo === 'ingreso' ? 'entrada' : 'salida'}</h2>
        </div>

        <input
          className="texto-input"
          placeholder="Nombre de la categoría"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          autoFocus
        />

        <button className="btn-primario" onClick={manejarCrear} disabled={guardando || !nombre.trim()}>
          {guardando ? 'Agregando…' : 'Agregar'}
        </button>

        <button className="btn-cancelar" onClick={onCerrar} disabled={guardando}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
