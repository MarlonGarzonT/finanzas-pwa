import { useState } from 'react';
import type { Categoria } from '../types';
import { SelectorEmoji } from './SelectorEmoji';
import './GestionCategorias.css';

interface Props {
  abierto: boolean;
  categorias: Categoria[];
  onCerrar: () => void;
  onCrear: (nombre: string, emoji: string) => Promise<void>;
  onEliminar: (id: string) => Promise<void>;
}

export function GestionCategorias({ abierto, categorias, onCerrar, onCrear, onEliminar }: Props) {
  const [nombre, setNombre] = useState('');
  const [emoji, setEmoji] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  if (!abierto) return null;

  async function manejarCrear() {
    const limpio = nombre.trim();
    if (!limpio || !emoji) return;
    setOcupado(true);
    await onCrear(limpio, emoji);
    setNombre('');
    setEmoji(null);
    setOcupado(false);
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
              <span className="categorias-lista__nombre">
                <span aria-hidden>{c.emoji}</span>
                {c.nombre}
              </span>
              <button onClick={() => manejarEliminar(c.id)} disabled={ocupado} aria-label={`Eliminar ${c.nombre}`}>
                ✕
              </button>
            </li>
          ))}
        </ul>

        <div className="nueva-categoria-form">
          <div className="nueva-categoria">
            <input placeholder="Nueva categoría" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <button onClick={manejarCrear} disabled={ocupado || !nombre.trim() || !emoji}>
              Agregar
            </button>
          </div>
          <SelectorEmoji seleccionado={emoji} onSeleccionar={setEmoji} />
        </div>

        <button className="btn-cancelar" onClick={onCerrar}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
