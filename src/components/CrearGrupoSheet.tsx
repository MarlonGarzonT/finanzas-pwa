import { useState } from 'react';
import { useGrupos } from '../data/GruposContext';
import type { Grupo } from '../types';
import { NOMBRE_VISIBLE_STORAGE_KEY, sugerenciaNombreVisible } from './nombreVisible';
import { useBloqueoDeFondo, useGestosSheet } from './useComportamientoSheet';
import './GrupoSheets.css';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  onCreado: (grupo: Grupo) => void;
}

export function CrearGrupoSheet({ abierto, onCerrar, onCreado }: Props) {
  const { crearGrupo } = useGrupos();
  const [nombre, setNombre] = useState('');
  const [nombreVisible, setNombreVisible] = useState(sugerenciaNombreVisible);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grupoCreado, setGrupoCreado] = useState<Grupo | null>(null);
  const [copiado, setCopiado] = useState(false);

  useBloqueoDeFondo(abierto);
  const gestos = useGestosSheet(abierto, cerrarYLimpiar);

  if (!abierto) return null;

  function cerrarYLimpiar() {
    onCerrar();
    if (grupoCreado) onCreado(grupoCreado);
    setNombre('');
    setGrupoCreado(null);
    setCopiado(false);
    setError(null);
  }

  async function manejarCrear() {
    const limpio = nombre.trim();
    const nombreVisibleLimpio = nombreVisible.trim();
    if (!limpio || !nombreVisibleLimpio) return;
    setGuardando(true);
    setError(null);
    try {
      const nuevo = await crearGrupo(limpio, nombreVisibleLimpio);
      localStorage.setItem(NOMBRE_VISIBLE_STORAGE_KEY, nombreVisibleLimpio);
      setGrupoCreado(nuevo);
    } catch {
      setError('No se pudo crear el grupo. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  async function copiarCodigo() {
    if (!grupoCreado) return;
    await navigator.clipboard.writeText(grupoCreado.codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  async function compartirCodigo() {
    if (!grupoCreado) return;
    const texto = `Únete a mi grupo "${grupoCreado.nombre}" en Mis Finanzas con el código: ${grupoCreado.codigo}`;
    if (navigator.share) {
      try {
        await navigator.share({ text: texto });
      } catch {
        // el usuario canceló el share sheet, no hacer nada
      }
    } else {
      await copiarCodigo();
    }
  }

  return (
    <div className="sheet-overlay" onClick={cerrarYLimpiar} style={gestos.overlayStyle}>
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
          <h2 className="sheet__titulo">{grupoCreado ? '¡Grupo creado!' : 'Nuevo grupo'}</h2>
        </div>

        {!grupoCreado ? (
          <>
            <input
              className="texto-input"
              placeholder="Nombre del grupo (ej. Viaje a la playa)"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
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
              onClick={manejarCrear}
              disabled={guardando || !nombre.trim() || !nombreVisible.trim()}
            >
              {guardando ? 'Creando…' : 'Crear grupo'}
            </button>
          </>
        ) : (
          <>
            <p className="grupo-sheets__ayuda">
              Comparte este código con quienes quieras sumar al grupo. Lo usan para unirse desde su propia cuenta.
            </p>
            <div className="grupo-sheets__codigo">{grupoCreado.codigo}</div>
            <button className="btn-primario" onClick={compartirCodigo}>
              Compartir código
            </button>
            <button className="btn-cancelar" onClick={copiarCodigo}>
              {copiado ? 'Copiado ✓' : 'Copiar código'}
            </button>
          </>
        )}

        <button className="btn-cancelar" onClick={cerrarYLimpiar} disabled={guardando}>
          {grupoCreado ? 'Listo' : 'Cancelar'}
        </button>
      </div>
    </div>
  );
}
