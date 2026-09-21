import { useState } from 'react';
import type { CambiosCategoria, Categoria, Tipo } from '../types';
import { EditarCategoriaSheet } from './EditarCategoriaSheet';
import './GestionCategorias.css';

interface Props {
  abierto: boolean;
  categorias: Categoria[];
  onCerrar: () => void;
  onCrear: (nombre: string, tipo: Tipo) => Promise<void>;
  onActualizar: (id: string, cambios: CambiosCategoria) => Promise<void>;
  onEliminar: (id: string) => Promise<void>;
}

export function GestionCategorias({ abierto, categorias, onCerrar, onCrear, onActualizar, onEliminar }: Props) {
  const [nombre, setNombre] = useState('');
  const [tipoNueva, setTipoNueva] = useState<Tipo>('egreso');
  const [ocupado, setOcupado] = useState(false);
  const [expandidaId, setExpandidaId] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  if (!abierto) return null;

  async function manejarCrear() {
    const limpio = nombre.trim();
    if (!limpio) return;
    setOcupado(true);
    await onCrear(limpio, tipoNueva);
    setNombre('');
    setTipoNueva('egreso');
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
        <p className="categorias-ayuda">Toca una categoría para editarla: nombre, emoji, tipo y gasto fijo.</p>

        <ul className="categorias-lista">
          {categorias.map((c) => (
            <li key={c.id}>
              <div
                className="categorias-lista__fila"
                onClick={() => setExpandidaId(expandidaId === c.id ? null : c.id)}
              >
                <span aria-hidden>{c.emoji}</span>
                <span className="categorias-lista__nombre">{c.nombre}</span>
                {c.esFijo && (
                  <span className="categorias-lista__insignia" aria-label="Gasto fijo mensual" title="Gasto fijo mensual">
                    📌
                  </span>
                )}
                <span className={`categorias-lista__tipo categorias-lista__tipo--${c.tipo}`}>
                  {c.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
                </span>
                <button
                  className="categorias-lista__eliminar"
                  onClick={(e) => {
                    e.stopPropagation();
                    manejarEliminar(c.id);
                  }}
                  disabled={ocupado}
                  aria-label={`Eliminar ${c.nombre}`}
                >
                  ✕
                </button>
              </div>

              {expandidaId === c.id && (
                <div className="categorias-lista__editor">
                  <button
                    type="button"
                    className="categorias-lista__editar-boton"
                    onClick={() => setEditandoId(c.id)}
                  >
                    Editar categoría
                    <span aria-hidden>›</span>
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="nueva-categoria-form">
          <div className="nueva-categoria">
            <input placeholder="Nueva categoría" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <button onClick={manejarCrear} disabled={ocupado || !nombre.trim()}>
              Agregar
            </button>
          </div>
          <div className="segmented">
            <button
              type="button"
              className={`segmented__btn segmented__btn--entrada ${tipoNueva === 'ingreso' ? 'segmented__btn--activo' : ''}`}
              onClick={() => setTipoNueva('ingreso')}
            >
              Ingreso
            </button>
            <button
              type="button"
              className={`segmented__btn segmented__btn--salida ${tipoNueva === 'egreso' ? 'segmented__btn--activo' : ''}`}
              onClick={() => setTipoNueva('egreso')}
            >
              Gasto
            </button>
          </div>
        </div>

        <button className="btn-cancelar" onClick={onCerrar}>
          Cerrar
        </button>
      </div>

      <EditarCategoriaSheet
        abierto={editandoId !== null}
        categoria={categorias.find((c) => c.id === editandoId) ?? null}
        onCerrar={() => setEditandoId(null)}
        onGuardar={onActualizar}
        onEliminar={async (id) => {
          await onEliminar(id);
          setExpandidaId(null);
        }}
      />
    </div>
  );
}
