import { lazy, Suspense, useEffect, useState } from 'react';
import type { Categoria, Tipo } from '../types';
import './NuevoMovimientoSheet.css';
import './EditarCategoriaSheet.css';
import { useBloqueoDeFondo, useGestosSheet } from './useComportamientoSheet';

const SelectorEmojiSheet = lazy(() =>
  import('./SelectorEmojiSheet').then((m) => ({ default: m.SelectorEmojiSheet }))
);

interface Props {
  abierto: boolean;
  categoria: Categoria | null;
  onCerrar: () => void;
  onGuardar: (id: string, cambios: { nombre: string; emoji: string; tipo: Tipo; esFijo: boolean }) => Promise<void>;
  onEliminar: (id: string) => Promise<void>;
}

export function EditarCategoriaSheet({ abierto, categoria, onCerrar, onGuardar, onEliminar }: Props) {
  const [nombre, setNombre] = useState('');
  const [emoji, setEmoji] = useState('🏷️');
  const [tipo, setTipo] = useState<Tipo>('egreso');
  const [esFijo, setEsFijo] = useState(false);
  const [emojiAbierto, setEmojiAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useBloqueoDeFondo(abierto);
  const gestos = useGestosSheet(abierto, onCerrar);

  // Al abrir (o cambiar de categoría), arranca desde los datos reales.
  useEffect(() => {
    if (!abierto || !categoria) return;
    setNombre(categoria.nombre);
    setEmoji(categoria.emoji);
    setTipo(categoria.tipo);
    setEsFijo(categoria.esFijo);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al abrir/cambiar de categoría
  }, [abierto, categoria?.id]);

  if (!abierto || !categoria) return null;

  async function manejarGuardar() {
    const limpio = nombre.trim();
    if (!limpio) {
      setError('El nombre no puede quedar vacío.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await onGuardar(categoria!.id, { nombre: limpio, emoji, tipo, esFijo });
      onCerrar();
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminar() {
    setGuardando(true);
    try {
      await onEliminar(categoria!.id);
      onCerrar();
    } catch {
      setError('No se pudo eliminar. Intenta de nuevo.');
      setGuardando(false);
    }
  }

  return (
    <div className="sheet-overlay sheet-overlay--anidado" onClick={onCerrar} style={gestos.overlayStyle}>
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
          <h2 className="sheet__titulo">Editar categoría</h2>
        </div>

        <button type="button" className="editar-categoria__emoji-boton" onClick={() => setEmojiAbierto(true)}>
          <span aria-hidden>{emoji}</span>
          Cambiar emoji
        </button>

        <input
          className="texto-input"
          placeholder="Nombre de la categoría"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <div className="segmented">
          <button
            type="button"
            className={`segmented__btn segmented__btn--entrada ${tipo === 'ingreso' ? 'segmented__btn--activo' : ''}`}
            onClick={() => setTipo('ingreso')}
          >
            Ingreso
          </button>
          <button
            type="button"
            className={`segmented__btn segmented__btn--salida ${tipo === 'egreso' ? 'segmented__btn--activo' : ''}`}
            onClick={() => setTipo('egreso')}
          >
            Gasto
          </button>
        </div>

        <label className="interruptor-fila">
          <span>Gasto fijo mensual (arriendo, cuotas...)</span>
          <span className="interruptor">
            <input type="checkbox" checked={esFijo} onChange={(e) => setEsFijo(e.target.checked)} />
            <span className="interruptor__riel" />
          </span>
        </label>

        {error && <p className="sheet__error">{error}</p>}

        <button className="btn-primario" onClick={manejarGuardar} disabled={guardando || !nombre.trim()}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>

        <button className="btn-eliminar" onClick={manejarEliminar} disabled={guardando}>
          Eliminar categoría
        </button>

        <button className="btn-cancelar" onClick={onCerrar} disabled={guardando}>
          Cancelar
        </button>
      </div>

      {emojiAbierto && (
        <Suspense fallback={null}>
          <SelectorEmojiSheet
            abierto
            seleccionado={emoji}
            onCerrar={() => setEmojiAbierto(false)}
            onSeleccionar={setEmoji}
            nivel={2}
          />
        </Suspense>
      )}
    </div>
  );
}
