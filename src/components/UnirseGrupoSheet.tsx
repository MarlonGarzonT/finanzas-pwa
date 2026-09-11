import { useState } from 'react';
import { useGrupos } from '../data/GruposContext';
import type { Grupo } from '../types';
import { NOMBRE_VISIBLE_STORAGE_KEY, sugerenciaNombreVisible } from './nombreVisible';
import { useBloqueoDeFondo, useGestosSheet } from './useComportamientoSheet';
import './GrupoSheets.css';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  onUnido: (grupo: Grupo) => void;
}

export function UnirseGrupoSheet({ abierto, onCerrar, onUnido }: Props) {
  const { unirseAGrupo } = useGrupos();
  const [codigo, setCodigo] = useState('');
  const [nombreVisible, setNombreVisible] = useState(sugerenciaNombreVisible);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useBloqueoDeFondo(abierto);
  const gestos = useGestosSheet(abierto, onCerrar);

  if (!abierto) return null;

  async function manejarUnirse() {
    const codigoLimpio = codigo.trim();
    const nombreVisibleLimpio = nombreVisible.trim();
    if (!codigoLimpio || !nombreVisibleLimpio) return;
    setGuardando(true);
    setError(null);
    try {
      const grupo = await unirseAGrupo(codigoLimpio, nombreVisibleLimpio);
      localStorage.setItem(NOMBRE_VISIBLE_STORAGE_KEY, nombreVisibleLimpio);
      setCodigo('');
      onCerrar();
      onUnido(grupo);
    } catch {
      setError('Ese código no existe. Revísalo e intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="sheet-overlay" onClick={onCerrar} style={gestos.overlayStyle}>
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
          <h2 className="sheet__titulo">Unirme a un grupo</h2>
        </div>

        <input
          className="texto-input"
          placeholder="Código de invitación"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          autoCapitalize="characters"
          autoFocus
        />
        <input
          className="texto-input"
          placeholder="Tu nombre para este grupo"
          value={nombreVisible}
          onChange={(e) => setNombreVisible(e.target.value)}
        />

        {error && <p className="sheet__error">{error}</p>}

        <button
          className="btn-primario"
          onClick={manejarUnirse}
          disabled={guardando || !codigo.trim() || !nombreVisible.trim()}
        >
          {guardando ? 'Uniéndome…' : 'Unirme'}
        </button>

        <button className="btn-cancelar" onClick={onCerrar} disabled={guardando}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
