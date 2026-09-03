import { useState } from 'react';
import type { CambiosCategoria, Categoria, Tipo } from '../types';
import { SelectorEmoji } from './SelectorEmoji';
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
        <p className="categorias-ayuda">
          Toca una categoría para cambiar su emoji, si es ingreso o gasto, y si es un gasto fijo mensual.
        </p>

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
                  <SelectorEmoji seleccionado={c.emoji} onSeleccionar={(emoji) => onActualizar(c.id, { emoji })} />

                  <div className="segmented">
                    <button
                      type="button"
                      className={`segmented__btn segmented__btn--entrada ${c.tipo === 'ingreso' ? 'segmented__btn--activo' : ''}`}
                      onClick={() => onActualizar(c.id, { tipo: 'ingreso' })}
                    >
                      Ingreso
                    </button>
                    <button
                      type="button"
                      className={`segmented__btn segmented__btn--salida ${c.tipo === 'egreso' ? 'segmented__btn--activo' : ''}`}
                      onClick={() => onActualizar(c.id, { tipo: 'egreso' })}
                    >
                      Gasto
                    </button>
                  </div>

                  <label className="interruptor-fila">
                    <span>Gasto fijo mensual (arriendo, cuotas...)</span>
                    <span className="interruptor">
                      <input
                        type="checkbox"
                        checked={c.esFijo}
                        onChange={(e) => onActualizar(c.id, { esFijo: e.target.checked })}
                      />
                      <span className="interruptor__riel" />
                    </span>
                  </label>
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
    </div>
  );
}
