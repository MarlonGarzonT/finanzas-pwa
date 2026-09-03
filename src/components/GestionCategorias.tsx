import { useState } from 'react';
import type { Categoria } from '../types';
import './GestionCategorias.css';

interface Props {
  abierto: boolean;
  categorias: Categoria[];
  onCerrar: () => void;
  onCrear: (nombre: string) => Promise<void>;
  onEliminar: (id: string) => Promise<void>;
}

export function GestionCategorias({ abierto, categorias, onCerrar, onCrear, onEliminar }: Props) {
  const [nombre, setNombre] = useState('');
  const [ocupado, setOcupado] = useState(false);

  if (!abierto) return null;

  async function manejarCrear() {
    const limpio = nombre.trim();
    if (!limpio) return;
    setOcupado(true);
    await onCrear(limpio);
    setNombre('');
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
