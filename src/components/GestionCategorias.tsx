import { useState } from 'react';
import type { Categoria } from '../types';
import { SelectorEmoji } from './SelectorEmoji';
import './GestionCategorias.css';

interface Props {
  abierto: boolean;
  categorias: Categoria[];
  onCerrar: () => void;
  onCrear: (nombre: string) => Promise<void>;
  onActualizarEmoji: (id: string, emoji: string) => Promise<void>;
  onEliminar: (id: string) => Promise<void>;
}

export function GestionCategorias({ abierto, categorias, onCerrar, onCrear, onActualizarEmoji, onEliminar }: Props) {
  const [nombre, setNombre] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [editandoEmojiId, setEditandoEmojiId] = useState<string | null>(null);

  if (!abierto) return null;

  async function manejarCrear() {
    const limpio = nombre.trim();
    if (!limpio) return;
    setOcupado(true);
    await onCrear(limpio);
    setNombre('');
    setOcupado(false);
  }

  async function manejarCambiarEmoji(id: string, emoji: string) {
    setOcupado(true);
    await onActualizarEmoji(id, emoji);
    setOcupado(false);
    setEditandoEmojiId(null);
  }

  async function manejarEliminar(id: string) {
    setOcupado(true);
    await onEliminar(id);
    setOcupado(false);
  }

  return (
    <div className="sheet-overlay" onClick={onCerrar}>
      <div className="sheet categorias-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__handle" />
        <h2 className="sheet__titulo">Categorías</h2>

        <ul className="categorias-lista">
          {categorias.map((c) => (
            <li key={c.id}>
              <div className="categorias-lista__fila">
                <button
                  type="button"
                  className="categorias-lista__emoji-btn"
                  onClick={() => setEditandoEmojiId(editandoEmojiId === c.id ? null : c.id)}
                  disabled={ocupado}
                  aria-label={`Cambiar emoji de ${c.nombre}`}
                >
                  {c.emoji}
                </button>
                <span className="categorias-lista__nombre">{c.nombre}</span>
                <button onClick={() => manejarEliminar(c.id)} disabled={ocupado} aria-label={`Eliminar ${c.nombre}`}>
                  ✕
                </button>
              </div>
              {editandoEmojiId === c.id && (
                <SelectorEmoji seleccionado={c.emoji} onSeleccionar={(emoji) => manejarCambiarEmoji(c.id, emoji)} />
              )}
            </li>
          ))}
        </ul>

        <div className="nueva-categoria">
          <input placeholder="Nueva categoría" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <button onClick={manejarCrear} disabled={ocupado}>
            Agregar
          </button>
        </div>

        <button className="btn-cancelar" onClick={onCerrar}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
